export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <style>{`
        * { box-sizing: border-box; }
        :root {
          --background: 222 47% 6%;
          --foreground: 60 9% 98%;
        }
        body { background: #030712; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #111827; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}</style>
      {children}
    </div>
  );
}