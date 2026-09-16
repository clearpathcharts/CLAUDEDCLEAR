// Board / Founders portal gate.
//
// The access code is verified server-side via POST /api/auth/board/verify
// (BOARD_ACCESS_CODE or VITE_BOARD_ACCESS_CODE in server env). Never ship a
// default code in the client bundle — an empty client constant forces the API path.
export const BOARD_ACCESS_CODE: string = '';
