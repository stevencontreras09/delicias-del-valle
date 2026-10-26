import { Pedido } from '../types';

// Ubicación por defecto del Taller Central de Delicias del Valle (Santo Domingo, República Dominicana)
export const DELICIAS_WORKSHOP_COORDS = {
  lat: 18.4861,
  lng: -69.9312,
  name: 'Taller Central - Delicias del Valle',
  address: 'Santo Domingo, Distrito Nacional, República Dominicana',
  googleMapsUrl: 'https://maps.google.com/?q=18.4861,-69.9312',
};

export interface RouteStop {
  pedido: Pedido;
  stopIndex: number;
  latitude: number;
  longitude: number;
  distanceFromPreviousKm: number;
  estimatedMinutesFromPrevious: number;
  cumulativeDistanceKm: number;
  cumulativeMinutes: number;
}

export interface OptimizedRouteResult {
  origin: { lat: number; lng: number; name: string };
  stops: RouteStop[];
  totalDistanceKm: number;
  totalEstimatedMinutes: number;
  unmappedPedidos: Pedido[]; // Pedidos sin coordenadas GPS exactas
  googleMapsUrl: string;
}

/**
 * Extrae coordenadas GPS de un pedido, buscando en latitud/longitud directas
 * o parseando enlaces oficiales de Google Maps y Waze.
 */
export function extractCoordsFromPedido(pedido: Pedido): { lat: number; lng: number } | null {
  if (
    typeof (pedido as any).latitud === 'number' &&
    !isNaN((pedido as any).latitud) &&
    typeof (pedido as any).longitud === 'number' &&
    !isNaN((pedido as any).longitud) &&
    (pedido as any).latitud !== 0
  ) {
    return { lat: (pedido as any).latitud, lng: (pedido as any).longitud };
  }

  if (pedido.maps_url && typeof pedido.maps_url === 'string') {
    const url = pedido.maps_url;
    const match =
      url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/destination=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= 17 && lat <= 20 && lng >= -72 && lng <= -68) {
        return { lat, lng };
      }
    }
  }

  return null;
}

/**
 * Fórmula de Haversine para calcular distancia esférica en kilómetros entre dos coordenadas
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estima los minutos de traslado en moto/vehículo en tráfico urbano dominicano
 * Velocidad promedio estimada: 22 km/h + 4 minutos por entrega para parquear y entregar
 */
export function estimateDrivingMinutes(distanceKm: number): number {
  const averageSpeedKmH = 22; // velocidad realista en tránsito urbano
  const travelTimeMinutes = (distanceKm / averageSpeedKmH) * 60;
  const stopHandlingMinutes = 4; // tiempo estimado por entrega
  return Math.max(3, Math.round(travelTimeMinutes + stopHandlingMinutes));
}

/**
 * Algoritmo del Vecino Más Cercano (Nearest Neighbor) con optimización de 2-opt
 * para secuenciar la ruta de pedidos minimizando la distancia y tiempo total de recorrido.
 */
export function optimizeDeliveryRoute(
  pedidos: Pedido[],
  startCoords: { lat: number; lng: number; name?: string } = DELICIAS_WORKSHOP_COORDS
): OptimizedRouteResult {
  const mappedList: { pedido: Pedido; lat: number; lng: number }[] = [];
  const unmappedPedidos: Pedido[] = [];

  pedidos.forEach((p) => {
    const coords = extractCoordsFromPedido(p);
    if (coords) {
      mappedList.push({ pedido: p, lat: coords.lat, lng: coords.lng });
    } else {
      unmappedPedidos.push(p);
    }
  });

  if (mappedList.length === 0) {
    return {
      origin: { ...startCoords, name: startCoords.name || 'Punto de Partida' },
      stops: [],
      totalDistanceKm: 0,
      totalEstimatedMinutes: 0,
      unmappedPedidos,
      googleMapsUrl: '',
    };
  }

  // Si solo hay 1 pedido mapeado
  if (mappedList.length === 1) {
    const single = mappedList[0];
    const dist = calculateHaversineDistanceKm(
      startCoords.lat,
      startCoords.lng,
      single.lat,
      single.lng
    );
    const mins = estimateDrivingMinutes(dist);

    const singleStop: RouteStop = {
      pedido: single.pedido,
      stopIndex: 1,
      latitude: single.lat,
      longitude: single.lng,
      distanceFromPreviousKm: Math.round(dist * 10) / 10,
      estimatedMinutesFromPrevious: mins,
      cumulativeDistanceKm: Math.round(dist * 10) / 10,
      cumulativeMinutes: mins,
    };

    return {
      origin: { ...startCoords, name: startCoords.name || 'Punto de Partida' },
      stops: [singleStop],
      totalDistanceKm: Math.round(dist * 10) / 10,
      totalEstimatedMinutes: mins,
      unmappedPedidos,
      googleMapsUrl: buildGoogleMapsMultiStopUrl(startCoords, [single]),
    };
  }

  // 1. Algoritmo Nearest Neighbor partiendo del origen
  const remaining = [...mappedList];
  const orderedList: { pedido: Pedido; lat: number; lng: number }[] = [];

  let currentLat = startCoords.lat;
  let currentLng = startCoords.lng;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const dist = calculateHaversineDistanceKm(
        currentLat,
        currentLng,
        candidate.lat,
        candidate.lng
      );

      // Si tiene horario de entrega temprano, prioridad ligera
      const effectiveDist = dist;

      if (effectiveDist < shortestDist) {
        shortestDist = effectiveDist;
        nearestIndex = i;
      }
    }

    const nextItem = remaining.splice(nearestIndex, 1)[0];
    orderedList.push(nextItem);
    currentLat = nextItem.lat;
    currentLng = nextItem.lng;
  }

  // 2. Refinamiento 2-Opt para evitar cruces en la ruta
  if (orderedList.length >= 4) {
    let improved = true;
    let iterations = 0;
    const maxIterations = 20;

    const calcRouteTotalDist = (list: { lat: number; lng: number }[]): number => {
      let sum = calculateHaversineDistanceKm(
        startCoords.lat,
        startCoords.lng,
        list[0].lat,
        list[0].lng
      );
      for (let i = 0; i < list.length - 1; i++) {
        sum += calculateHaversineDistanceKm(
          list[i].lat,
          list[i].lng,
          list[i + 1].lat,
          list[i + 1].lng
        );
      }
      return sum;
    };

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;
      let bestDist = calcRouteTotalDist(orderedList);

      for (let i = 0; i < orderedList.length - 1; i++) {
        for (let k = i + 1; k < orderedList.length; k++) {
          const newRoute = [
            ...orderedList.slice(0, i),
            ...orderedList.slice(i, k + 1).reverse(),
            ...orderedList.slice(k + 1),
          ];
          const newDist = calcRouteTotalDist(newRoute);

          if (newDist < bestDist - 0.05) {
            orderedList.splice(0, orderedList.length, ...newRoute);
            bestDist = newDist;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
  }

  // 3. Construir paradas con distancias y tiempos acumulados
  const stops: RouteStop[] = [];
  let prevLat = startCoords.lat;
  let prevLng = startCoords.lng;
  let totalKm = 0;
  let totalMins = 0;

  orderedList.forEach((item, idx) => {
    const legDist = calculateHaversineDistanceKm(
      prevLat,
      prevLng,
      item.lat,
      item.lng
    );
    // Factor de ruta vial (+30% por trazado de calles)
    const roadDist = Math.round(legDist * 1.3 * 10) / 10;
    const legMins = estimateDrivingMinutes(roadDist);

    totalKm += roadDist;
    totalMins += legMins;

    stops.push({
      pedido: item.pedido,
      stopIndex: idx + 1,
      latitude: item.lat,
      longitude: item.lng,
      distanceFromPreviousKm: roadDist,
      estimatedMinutesFromPrevious: legMins,
      cumulativeDistanceKm: Math.round(totalKm * 10) / 10,
      cumulativeMinutes: totalMins,
    });

    prevLat = item.lat;
    prevLng = item.lng;
  });

  return {
    origin: { ...startCoords, name: startCoords.name || 'Punto de Partida' },
    stops,
    totalDistanceKm: Math.round(totalKm * 10) / 10,
    totalEstimatedMinutes: totalMins,
    unmappedPedidos,
    googleMapsUrl: buildGoogleMapsMultiStopUrl(startCoords, orderedList),
  };
}

/**
 * Genera la URL nativa oficial de Google Maps con múltiples paradas secuenciadas
 */
export function buildGoogleMapsMultiStopUrl(
  origin: { lat: number; lng: number },
  stopsInSequence: { pedido: Pedido; lat?: number; lng?: number }[]
): string {
  if (stopsInSequence.length === 0) return '';

  const originStr = `${origin.lat},${origin.lng}`;

  if (stopsInSequence.length === 1) {
    const s = stopsInSequence[0];
    const dest =
      s.lat && s.lng
        ? `${s.lat},${s.lng}`
        : encodeURIComponent(s.pedido.direccion_entrega || '');
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${dest}&travelmode=driving`;
  }

  // La última parada es el destino final
  const last = stopsInSequence[stopsInSequence.length - 1];
  const destStr =
    last.lat && last.lng
      ? `${last.lat},${last.lng}`
      : encodeURIComponent(last.pedido.direccion_entrega || '');

  // Las paradas intermedias son los waypoints (Google Maps soporta hasta 9 waypoints en URL)
  const waypoints = stopsInSequence
    .slice(0, stopsInSequence.length - 1)
    .map((s) =>
      s.lat && s.lng
        ? `${s.lat},${s.lng}`
        : encodeURIComponent(s.pedido.direccion_entrega || '')
    )
    .filter(Boolean)
    .slice(0, 9);

  const waypointsParam =
    waypoints.length > 0 ? `&waypoints=${waypoints.join('|')}` : '';

  return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}${waypointsParam}&travelmode=driving`;
}
