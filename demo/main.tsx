import { createRoot } from 'react-dom/client';
import { Markdown } from '../src/index.js';
createRoot(document.getElementById('root')!).render(<main><h1>Stream MD</h1><Markdown source="Ready to stream." /></main>);
