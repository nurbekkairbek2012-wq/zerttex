import { lazy, Suspense } from 'react';
import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ChatProvider } from './lib/chat';
import { StoreProvider } from './lib/store';
import Home from './pages/Home';

// Home loads first; other pages load on demand to keep the first visit fast on mobile networks.
const About = lazy(() => import('./pages/About'));
const Book = lazy(() => import('./pages/Book'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const Live = lazy(() => import('./pages/Live'));
const Operator = lazy(() => import('./pages/Operator'));
const Pass = lazy(() => import('./pages/Pass'));
const TripPage = lazy(() => import('./pages/Trip'));
const Trust = lazy(() => import('./pages/Trust'));

function NotFound() {
  return (
    <section className="section narrow">
      <h1>This page doesn’t exist</h1>
      <p>The link may be old. Start from the trips page.</p>
      <Link to="/" className="btn btn--primary">
        Show all trips
      </Link>
    </section>
  );
}

// HashRouter keeps every deep link working on any static host (Vercel, Netlify, GitHub Pages, a file).
export default function App() {
  return (
    <HashRouter>
      <StoreProvider>
        <ChatProvider>
          <Layout>
            <Suspense fallback={<div className="section narrow" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/trips/:id" element={<TripPage />} />
              <Route path="/book/:id" element={<Book />} />
              <Route path="/pass/:code" element={<Pass />} />
              <Route path="/live/:code" element={<Live />} />
              <Route path="/trust" element={<Trust />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/operator" element={<Operator />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </Layout>
        </ChatProvider>
      </StoreProvider>
    </HashRouter>
  );
}
