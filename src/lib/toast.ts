/** 組出帶有 ?success= 提示訊息的重導向網址，供 Server Action 導頁後顯示成功提示。 */
export function withSuccess(path: string, message: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}success=${encodeURIComponent(message)}`;
}
