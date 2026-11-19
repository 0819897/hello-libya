/// <reference types="vite/client" />

/** Build time (Libya time, YYYY-MM-DD HH:MM), shown in Settings to check which version a phone runs. */
declare const __APP_BUILD__: string;

/** Salted PBKDF2 hash of the TEACHER_CODE build secret, or null when no code is configured. */
declare const __TEACHER_HASH__: { salt: string; iterations: number; hash: string } | null;
