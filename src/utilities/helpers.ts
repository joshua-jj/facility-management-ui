import localForage from 'localforage';
// import queryParser from 'query-string';

interface RequestConfig {
  method?: string;
  headers?: Headers;
  body?: BodyInit | null;
  // ... other possible request configuration options
}

export const reverseString = (str: string) => str.split('').reverse().join('');

export const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const createRequest = (
  url: string = '',
  config: RequestConfig = {},
): Request => {
  const validMethods = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'PATCH'];
  const defaultConfig: RequestInit = {
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
  };
  const defaultHeaders = new Headers();
  defaultHeaders.set('Content-Type', 'application/json');
  defaultHeaders.set('Accept', `application/json`);

  if (typeof config.method !== 'string') {
    throw new TypeError('config method property must be a string.');
  }
  if (!validMethods.includes(config.method?.toUpperCase() || '')) {
    // Use optional chaining
    throw new Error(
      "config method property value must be one of ['GET','POST','HEAD','PUT','DELETE']",
    );
  }

  config.headers = config.headers || defaultHeaders;

  if (config.headers && !(config.headers instanceof Headers)) {
    throw new TypeError('config headers property must be of type Headers.');
  }

  const requestConfig = {
    ...defaultConfig,
    ...config,
  };
  return new Request(url, requestConfig);
};

export const createRequestWithToken =
  (url: string = '', config: RequestConfig = {}) =>
  (token: string): Request => {
    const validMethods = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'PATCH'];
    const defaultConfig: RequestInit = {
      mode: 'cors',
      cache: 'default', // Assuming 'default' is an acceptable value
      credentials: 'same-origin',
    };
    const defaultHeaders = new Headers();
    defaultHeaders.set('Content-Type', 'application/json');
    defaultHeaders.set('Authorization', `Bearer ${token}`);
    defaultHeaders.set('Accept', 'application/json');

    if (typeof config.method !== 'string') {
      throw new TypeError('config method property must be a string.');
    }
    if (!validMethods.includes(config.method?.toUpperCase() || '')) {
      // Use optional chaining
      throw new Error(
        "config method property value must be one of ['GET','POST','HEAD','PUT','DELETE']",
      );
    }

    config.headers = config.headers || defaultHeaders;

    if (config.headers && !(config.headers instanceof Headers)) {
      throw new TypeError('config headers property must be of type Headers.');
    }

    const requestConfig = {
      ...defaultConfig,
      ...config,
    };
    return new Request(url, requestConfig);
  };

export const createMultiPartRequestWithToken =
  (url: string = '', config: RequestInit) =>
  (token: string): Request => {
    const validMethods = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'PATCH'];

    const defaultConfig: RequestInit = {
      mode: 'cors',
      cache: 'default',
      credentials: 'same-origin',
    };

    const defaultHeaders = new Headers();
    defaultHeaders.set('Authorization', `Bearer ${token}`);
    defaultHeaders.set('Accept', 'application/json');

    if (typeof config.method !== 'string') {
      throw new TypeError('config method property must be a string.');
    }

    if (validMethods.indexOf(config.method.toUpperCase()) === -1) {
      throw new Error(
        "config method property value must be one of ['GET','POST','HEAD','PUT','DELETE']",
      );
    }

    // Set default headers if no headers provided in the config
    config.headers = config.headers || defaultHeaders;

    if (config.headers && !(config.headers instanceof Headers)) {
      throw new TypeError('config headers property must be of type Headers.');
    }

    const requestConfig: RequestInit = {
      ...defaultConfig,
      ...config,
    };

    return new Request(url, requestConfig);
  };

class HttpError extends Error {
  status!: string;
  response!: Response;
  constructor(message: string) {
    super(message);
  }
}

export const checkStatus = (response: Response): Response => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new HttpError(`HTTP Error ${response.statusText}`);
    error.status = response.statusText;
    error.response = response;

    throw error;
  }
};

interface ParsedResponse {
  data?: unknown;
  message?: string;
  error?: string;
}

export const parseResponse = async (
  response: Response,
): Promise<ParsedResponse> => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      if (response.status === 204) {
        return { data: [] };
      } else {
        return await response.json();
      }
    } else {
      const text = await response.text();
      return { message: text };
    }
  } catch (err) {
    // Handle potential crashlytics integration (if applicable)
    // ...
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

export interface StorageObject {
  [key: string]: unknown;
}

export const setObjectInStorage = async (
  key: string,
  object: StorageObject | boolean,
): Promise<boolean> => {
  try {
    await localForage.setItem(key, object);
    return true;
  } catch (error) {
    throw error;
  }
};

interface StoredObject {
  // Define the structure of the object you expect to retrieve from storage
  [key: string]: unknown;
}

export const getObjectFromStorage = async (
  key: string,
): Promise<StoredObject | null> => {
  try {
    const object = await localForage.getItem<StoredObject>(key);

    if (!object) {
      return null;
    }

    return object;
  } catch (error) {
    throw error;
  }
};

export const clearObjectFromStorage = async (key: string): Promise<boolean> => {
  try {
    await localForage.removeItem(key);
    return true;
  } catch (error) {
    throw error;
  }
};

export const capitalizeFirstLetter = (string: string): string => {
  if (typeof string === 'string' && string.length > 0) {
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
  }

  return '';
};

export const generateBackground = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
};

export const getInitials = (name: string): string => {
  const words = name?.split(' ');
  if (words?.length > 0) {
    const firstInitial = words[0][0].toUpperCase();
    let secondInitial = '';

    if (words.length > 1) {
      secondInitial = words[1][0].toUpperCase();
    }

    return `${firstInitial}${secondInitial}`;
  } else {
    return '';
  }
};

export const toFormData = (data: Record<string, string | Blob>): FormData => {
  const fData = new FormData();

  for (const field of Object.keys(data)) {
    fData.append(field, data[field]);
  }

  return fData;
};

export function validImageFileTypes(
  file: File | null,
  setState: (message: string) => void,
): boolean | undefined {
  const imgMaxSize = 1024 * 1024; // assuming 1MB
  const imageFileTypes = ['image/png', 'image/jpeg', 'image/jpg'];

  if (!file) {
    return;
  }

  if (file.size > imgMaxSize) {
    setState('Image size should not exceed 1MB');
  } else if (!imageFileTypes.includes(file.type)) {
    setState(
      'Selected file is not an image type, please choose one of the types: .png, .jpg, .jpeg',
    );
  } else {
    setState('');
    return true;
  }
}

export const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const isPastDate = (date: string | Date): boolean => {
  const now = new Date();
  return new Date(date) < now;
};
