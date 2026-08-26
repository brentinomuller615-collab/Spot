export type GeolocationErrorType =
  | 'permission_denied'
  | 'position_unavailable'
  | 'timeout'
  | 'unsupported';

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeolocationError {
  type: GeolocationErrorType;
  message: string;
}

export function getCurrentPosition(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        type: 'unsupported',
        message: 'Your browser does not support location services.',
      } satisfies GeolocationError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            reject({
              type: 'permission_denied',
              message:
                'Location permission is required to save your parking location. Please enable location access in your browser settings.',
            } satisfies GeolocationError);
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            reject({
              type: 'position_unavailable',
              message: "Your location couldn't be determined. Please try again.",
            } satisfies GeolocationError);
            break;
          case GeolocationPositionError.TIMEOUT:
            reject({
              type: 'timeout',
              message: "We couldn't get your location in time. Please try again.",
            } satisfies GeolocationError);
            break;
          default:
            reject({
              type: 'position_unavailable',
              message: "Your location couldn't be determined. Please try again.",
            } satisfies GeolocationError);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,       // 15 seconds before timeout error
        maximumAge: 30000,    // Accept cached position up to 30 seconds old
      }
    );
  });
}
