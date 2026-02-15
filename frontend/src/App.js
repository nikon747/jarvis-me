import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import JarvisApp from "@/pages/JarvisApp";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<JarvisApp />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#0A0A0F',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            color: '#E0E0E0',
            fontFamily: 'Barlow, sans-serif',
          },
        }}
      />
    </div>
  );
}

export default App;
