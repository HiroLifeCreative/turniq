import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage para zustand/persist usando AsyncStorage directamente (asíncrono).
 * El adaptador anterior con caché en memoria devolvía vacío al arrancar
 * (la carga async no había terminado) y la app sobrescribía los datos.
 */
export const zustandStorage = AsyncStorage;
