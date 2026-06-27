/**
 * INTEGRAÇÃO GOOGLE MAPS NO FRONTEND - GUIA ESSENCIAL
 *
 * USO PELO COMPONENTE PAI:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Armazena para controlar o mapa a partir do componente pai; o Google Maps gerencia a renderização.
 * </MapView>
 *
 * ======
 * Bibliotecas disponíveis e funcionalidades principais:
 * -------------------------------
 * 📍 MARKER (biblioteca `marker`)
 * - Anexa ao mapa usando { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (biblioteca `places`)
 * - Não anexa diretamente ao mapa; use os dados manualmente no mapa.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (biblioteca `geocoding`)
 * - Serviço independente; aplique os resultados manualmente ao mapa.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRIA (biblioteca `geometry`)
 * - Funções utilitárias puras; não são anexadas ao mapa.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROTAS (biblioteca `routes`)
 * - Combina DirectionsService (independente) + DirectionsRenderer (anexado ao mapa)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ CAMADAS DO MAPA (anexa diretamente ao mapa)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “anexado ao mapa” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “independente” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “apenas dados” → Place, utilitários de Geometry.
 */

/// <reference types="@types/google.maps" />

// Importações de hooks do React para gerenciar efeitos e referências
import { useEffect, useRef } from "react";

// Importação do hook usePersistFn para preservar função entre re-renders
import { usePersistFn } from "@/hooks/usePersistFn";

// Importação da função utilitária cn para mesclar classes CSS
import { cn } from "@/lib/utils";

/**
 * Declaração global para adicionar o objeto google ao Window
 * Isso permite que o TypeScript reconheça window.google
 */
declare global {
  interface Window {
    google?: typeof google;
  }
}

/**
 * API Key do Google Maps obtida das variáveis de ambiente
 * Usada para autenticação com a API do Google Maps
 */
const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;

/**
 * URL base do proxy Forge
 * Forge é um serviço proxy para APIs do Google
 * Permite usar Google Maps sem expor a API key diretamente no frontend
 */
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterflyeffect.dev";

/**
 * URL completa do proxy do Google Maps
 * Combina a URL base com o endpoint de proxy
 */
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

/**
 * Carrega dinamicamente o script do Google Maps via proxy Forge
 * 
 * Funcionalidades:
 * - Cria elemento script dinamicamente
 * - Usa o proxy Forge para carregar a API
 * - Carrega bibliotecas adicionais: marker, places, geocoding, geometry
 * - Remove o script do DOM após carregamento para manter o documento limpo
 * - Retorna Promise que resolve quando o script é carregado
 * 
 * @returns Promise que resolve quando o script é carregado
 */
function loadMapScript() {
  return new Promise(resolve => {
    // Cria elemento script
    const script = document.createElement("script");
    
    // Configura URL do script com API key e bibliotecas
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    
    // Callback quando script é carregado com sucesso
    script.onload = () => {
      resolve(null);
      script.remove(); // Remove imediatamente para manter o DOM limpo
    };
    
    // Callback quando ocorre erro no carregamento
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
    };
    
    // Adiciona script ao head do documento
    document.head.appendChild(script);
  });
}

/**
 * Interface das props do componente MapView
 * Define as configurações do mapa
 */
interface MapViewProps {
  /**
   * Classe CSS personalizada para o container do mapa
   * Permite estilização adicional
   */
  className?: string;

  /**
   * Coordenadas iniciais do centro do mapa
   * Padrão: San Francisco (37.7749, -122.4194)
   */
  initialCenter?: google.maps.LatLngLiteral;

  /**
   * Nível de zoom inicial do mapa
   * Padrão: 12
   */
  initialZoom?: number;

  /**
   * Callback acionado quando o mapa está pronto para uso
   * Fornece a instância do mapa para controle externo
   */
  onMapReady?: (map: google.maps.Map) => void;
}

/**
 * MapView é um componente que renderiza um mapa do Google Maps
 * 
 * Características:
 * - Carrega o script do Google Maps dinamicamente via proxy Forge
 * - Inicializa o mapa com configurações personalizadas
 * - Fornece callback quando o mapa está pronto
 * - Usa referências para preservar instância do mapa
 * - Carrega bibliotecas adicionais: marker, places, geocoding, geometry
 * - Controles de mapa habilitados: zoom, fullscreen, street view, map type
 * 
 * Uso típico:
 * 1. Renderizar o componente com initialCenter e initialZoom
 * 2. Usar onMapReady para obter a instância do mapa
 * 3. Usar a instância para adicionar markers, camadas, etc.
 */
export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  // Referência ao elemento DIV que conterá o mapa
  const mapContainer = useRef<HTMLDivElement>(null);
  
  // Referência à instância do mapa do Google Maps
  const map = useRef<google.maps.Map | null>(null);

  /**
   * Função de inicialização do mapa
   * Preservada entre re-renders usando usePersistFn
   * Carrega o script e inicializa o mapa apenas uma vez
   */
  const init = usePersistFn(async () => {
    // Aguarda o carregamento do script do Google Maps
    await loadMapScript();
    
    // Valida se o container do mapa existe
    if (!mapContainer.current) {
      console.error("Map container not found");
      return;
    }
    
    // Cria nova instância do mapa do Google Maps
    map.current = new window.google.maps.Map(mapContainer.current, {
      zoom: initialZoom, // Nível de zoom inicial
      center: initialCenter, // Coordenadas do centro
      mapTypeControl: true, // Controle de tipo de mapa
      fullscreenControl: true, // Controle de tela cheia
      zoomControl: true, // Controle de zoom
      streetViewControl: true, // Controle de Street View
      mapId: "DEMO_MAP_ID", // ID do mapa para configurações personalizadas
    });
    
    // Chama callback se fornecido, passando a instância do mapa
    if (onMapReady) {
      onMapReady(map.current);
    }
  });

  // Efeito para inicializar o mapa na montagem do componente
  useEffect(() => {
    init();
  }, [init]);

  // Renderiza o container do mapa
  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
  );
}
