import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RequestFormProvider } from './context/RequestFormContext';
import LoadingSpinner from './components/LoadingSpinner';
import NotFound from './Pages/NotFound'; // Import directly, not lazy

// Lazy load components
const Home = lazy(() => import('./Pages/home'));
const Product = lazy(() => import('./Pages/product'));
const ProjectReference = lazy(() => import('./Pages/project_reference'));
const NewArticle = lazy(() => import('./Pages/new_article'));
const New = lazy(() => import('./Pages/new'));
const Article = lazy(() => import('./Pages/article'));

// CMS admin dashboard (own chunk + scoped styles, only loaded on /admin/*)
const AdminApp = lazy(() => import('./admin/AdminApp'));

function App() {
  return (
    <RequestFormProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner fullScreen={true} size="large" text="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/product" element={<Product />} />
            <Route path="/projects-reference" element={<ProjectReference />} />
            <Route path="/news-article" element={<NewArticle />} />
            <Route path="/new" element={<New />} />
            <Route path="/article" element={<Article />} />
            <Route path="/admin/*" element={<AdminApp />} />
            {/* Catch all unmatched routes including /en/, /en/anything, etc. */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </RequestFormProvider>
  );
}

export default App;
