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

    const handleSuccess = (position: GeolocationPosition) => {
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    };

    const handleFinalError = (error: GeolocationPositionError) => {
      switch (error.code) {
        case GeolocationPositionError.PERMISSION_DENIED:
          reject({
            type: 'permission_denied',
            message:
              'Location permission is required to save your parking location. Please enable location access in your browser settings.',
          } satisfies GeolocationError);
          break;
        case GeolocationPositionError.TIMEOUT:
          reject({
            type: 'timeout',
            message: "We couldn't get your location in time. Please try again.",
          } satisfies GeolocationError);
          break;
        case GeolocationPositionError.POSITION_UNAVAILABLE:
        default:
          reject({
            type: 'position_unavailable',
            message: "Your location couldn't be determined. Please try again.",
          } satisfies GeolocationError);
          break;
      }
    };

    // ATTEMPT 1: High Accuracy
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (error) => {
        // If permission is denied, fail immediately without fallback.
        if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
          handleFinalError(error);
          return;
        }

        // ATTEMPT 2: Fallback to lower accuracy
        // Triggered by POSITION_UNAVAILABLE or TIMEOUT
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          handleFinalError,
          {
            enableHighAccuracy: false,
            timeout: 10000,       // 10 seconds for fallback attempt
            maximumAge: 60000,    // Accept older cached positions
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,       // 10 seconds for high-accuracy attempt (reduced slightly to allow fallback in a reasonable time)
        maximumAge: 30000,    // Accept cached position up to 30 seconds old
      }
    );
  });
}
