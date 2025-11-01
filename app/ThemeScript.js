"use client";

export default function ThemeScript() {
  const code = `
(function() {
  try {
    var key = 'topbar-mode';
    var saved = localStorage.getItem(key);       // 'light' | 'dark' | null
    var mode = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', mode);
  } catch (e) {}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
