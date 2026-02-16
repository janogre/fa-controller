import { useEffect, useState, FormEvent } from "react";
import { api } from "../services/api";
import {
  Rss, RefreshCw, Bookmark, BookmarkCheck, ExternalLink, X, Plus,
  Search, StickyNote, ChevronDown, ChevronUp, Settings2, Trash2,
  Clock, Filter, Loader2, Eye
} from "lucide-react";

interface NewsSource {
  id: number;
  name: string;
  url: string;
  sourceType: string;
  category: string | null;
  enabled: boolean;
  lastFetchedAt: string | null;
}

interface NewsArticle {
  id: number;
  sourceId: number;
  title: string;
  link: string | null;
  description: string | null;
  author: string | null;
  category: string | null;
  publishedAt: string | null;
  bookmarked: boolean;
  read: boolean;
  notes: string | null;
  source?: NewsSource;
}

const categoryColors: Record<string, string> = {
  "Teknisk": "bg-fiber/10 text-fiber border-fiber/20",
  "Regulatorisk": "bg-warn/10 text-warn border-warn/20",
  "Marked": "bg-signal/10 text-signal border-signal/20",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}t`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mnd`;
}

function SourceModal({ source, onSave, onClose }: {
  source: NewsSource | null;
  onSave: (data: Partial<NewsSource>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: source?.name || "",
    url: source?.url || "",
    sourceType: source?.sourceType || "rss",
    category: source?.category || "Teknisk",
    enabled: source?.enabled ?? true,
  });
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); onSave(form); };

  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" onClick={onClose}>
      <div className="card-panel w-full max-w-md mx-4 p-6 animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-heading">{source ? "Rediger kilde" : "Ny kilde"}</h2>
          <button onClick={onClose} className="p-1 rounded text-muted hover:text-t-bright transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Type</label>
            <select value={form.sourceType} onChange={e => setForm(f => ({ ...f, sourceType: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm focus:outline-none focus:border-fiber/40 transition-colors">
              <option value="rss">RSS-feed</option>
              <option value="sitemap">Sitemap (XML)</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Navn *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="F.eks. Light Reading"
              className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm focus:outline-none focus:border-fiber/40 transition-colors placeholder:text-muted/40" />
          </div>
          <div>
            <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">{form.sourceType === "sitemap" ? "Sitemap URL *" : "RSS URL *"}</label>
            <input required value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder={form.sourceType === "sitemap" ? "https://example.com/sitemap.xml" : "https://example.com/rss.xml"}
              className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm font-mono focus:outline-none focus:border-fiber/40 transition-colors placeholder:text-muted/40" />
          </div>
          <div>
            <label className="block font-mono text-[0.65rem] text-muted tracking-wider uppercase mb-1.5">Kategori</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm focus:outline-none focus:border-fiber/40 transition-colors">
              <option value="Teknisk">Teknisk</option>
              <option value="Regulatorisk">Regulatorisk</option>
              <option value="Marked">Marked</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="enabled" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className="w-4 h-4 rounded bg-surface border-b-subtle accent-fiber" />
            <label htmlFor="enabled" className="text-sm text-t-default">Aktiv</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-b-subtle text-muted hover:text-t-bright transition-colors">Avbryt</button>
            <button type="submit" className="btn-fiber px-5 py-2 text-sm">{source ? "Lagre" : "Opprett"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NotesModal({ article, onSave, onClose }: {
  article: NewsArticle;
  onSave: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(article.notes || "");
  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" onClick={onClose}>
      <div className="card-panel w-full max-w-md mx-4 p-6 animate-slide-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-heading">Notat</h3>
          <button onClick={onClose} className="p-1 rounded text-muted hover:text-t-bright transition-colors"><X size={18} /></button>
        </div>
        <p className="text-sm text-muted mb-4 line-clamp-2">{article.title}</p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} placeholder="Skriv dine tanker om denne artikkelen..."
          className="w-full px-3 py-2 bg-surface border border-b-subtle rounded-lg text-t-bright text-sm focus:outline-none focus:border-fiber/40 transition-colors resize-none placeholder:text-muted/40" />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-b-subtle text-muted hover:text-t-bright transition-colors">Avbryt</button>
          <button onClick={() => onSave(notes)} className="btn-fiber px-5 py-2 text-sm">Lagre</button>
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ article, onToggleBookmark, onOpenNotes, onMarkRead }: {
  article: NewsArticle;
  onToggleBookmark: () => void;
  onOpenNotes: () => void;
  onMarkRead: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const catClass = categoryColors[article.category || ""] || "bg-surface text-muted border-b-subtle";

  return (
    <div className={`card-panel p-0 overflow-hidden transition-all ${article.read ? "opacity-60" : ""}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Category indicator bar */}
          <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
            article.category === "Teknisk" ? "bg-fiber/60" :
            article.category === "Regulatorisk" ? "bg-warn/60" :
            article.category === "Marked" ? "bg-signal/60" : "bg-muted/30"
          }`} />

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                {article.link ? (
                  <a href={article.link} target="_blank" rel="noopener noreferrer"
                    onClick={() => { if (!article.read) onMarkRead(); }}
                    className="text-t-bright font-medium text-sm hover:text-fiber transition-colors inline-flex items-center gap-1.5 group">
                    <span className="line-clamp-2">{article.title}</span>
                    <ExternalLink size={12} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <span className="text-t-bright font-medium text-sm line-clamp-2">{article.title}</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={onToggleBookmark}
                  className={`p-1.5 rounded-md transition-all ${article.bookmarked
                    ? "text-warn hover:text-warn/70"
                    : "text-muted/40 hover:text-warn"}`}
                  title={article.bookmarked ? "Fjern bokmerke" : "Bokmerke"}>
                  {article.bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                </button>
                <button onClick={onOpenNotes}
                  className={`p-1.5 rounded-md transition-all ${article.notes
                    ? "text-fiber hover:text-fiber/70"
                    : "text-muted/40 hover:text-fiber"}`}
                  title="Notat">
                  <StickyNote size={15} />
                </button>
                {!article.read && (
                  <button onClick={onMarkRead}
                    className="p-1.5 rounded-md text-muted/40 hover:text-signal transition-all"
                    title="Marker som lest">
                    <Eye size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              {article.category && (
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[0.6rem] font-mono font-medium tracking-wide border ${catClass}`}>
                  {article.category}
                </span>
              )}
              {article.source && (
                <span className="text-[0.65rem] text-muted font-mono">{article.source.name}</span>
              )}
              {article.publishedAt && (
                <span className="text-[0.65rem] text-muted/60 flex items-center gap-1">
                  <Clock size={10} />
                  {timeAgo(article.publishedAt)}
                </span>
              )}
              {article.author && (
                <span className="text-[0.65rem] text-muted/50">· {article.author}</span>
              )}
            </div>

            {/* Notes indicator */}
            {article.notes && (
              <div className="mt-2 px-2 py-1.5 bg-fiber/5 border border-fiber/10 rounded text-[0.7rem] text-fiber/70 line-clamp-1">
                📝 {article.notes}
              </div>
            )}

            {/* Expandable description */}
            {article.description && (
              <div className="mt-2">
                <button onClick={() => setExpanded(!expanded)}
                  className="text-[0.7rem] text-muted hover:text-t-default transition-colors flex items-center gap-1">
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {expanded ? "Skjul" : "Vis beskrivelse"}
                </button>
                {expanded && (
                  <p className="text-sm text-t-default/70 mt-1.5 leading-relaxed animate-fade-in">
                    {article.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [sourceModal, setSourceModal] = useState<{ open: boolean; source: NewsSource | null }>({ open: false, source: null });
  const [notesModal, setNotesModal] = useState<NewsArticle | null>(null);

  const loadData = async () => {
    try {
      const [arts, srcs] = await Promise.all([
        api.getNewsArticles({ bookmarked: showBookmarked || undefined, category: categoryFilter || undefined }),
        api.getNewsSources(),
      ]);
      setArticles(arts);
      setSources(srcs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [categoryFilter, showBookmarked]);

  const handleFetchAll = async () => {
    setFetching(true);
    try {
      await api.fetchAllFeeds();
      await loadData();
    } catch (err) { console.error(err); }
    finally { setFetching(false); }
  };

  const handleToggleBookmark = async (id: number) => {
    try {
      await api.toggleBookmark(id);
      setArticles(prev => prev.map(a => a.id === id ? { ...a, bookmarked: !a.bookmarked } : a));
    } catch (err) { console.error(err); }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markAsRead(id);
      setArticles(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    } catch (err) { console.error(err); }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!notesModal) return;
    try {
      await api.updateArticleNotes(notesModal.id, notes);
      setArticles(prev => prev.map(a => a.id === notesModal.id ? { ...a, notes } : a));
      setNotesModal(null);
    } catch (err) { console.error(err); }
  };

  const handleSaveSource = async (data: Partial<NewsSource>) => {
    try {
      if (sourceModal.source) {
        await api.updateNewsSource(sourceModal.source.id, data);
      } else {
        await api.createNewsSource(data);
      }
      setSourceModal({ open: false, source: null });
      const srcs = await api.getNewsSources();
      setSources(srcs);
    } catch (err) { console.error(err); }
  };

  const handleDeleteSource = async (id: number) => {
    if (!confirm("Slette kilden og alle tilhørende artikler?")) return;
    try {
      await api.deleteNewsSource(id);
      const srcs = await api.getNewsSources();
      setSources(srcs);
      await loadData();
    } catch (err) { console.error(err); }
  };

  const filteredArticles = articles.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.source?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = articles.filter(a => !a.read).length;
  const bookmarkedCount = articles.filter(a => a.bookmarked).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-fiber/30 border-t-fiber rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between animate-slide-in-up">
        <div>
          <h1 className="font-display text-3xl text-heading tracking-tight">Nyhetsfeed</h1>
          <p className="text-muted mt-1">
            <span className="font-mono text-sm">{unreadCount}</span> ulest · <span className="font-mono text-sm">{bookmarkedCount}</span> bokmerket · <span className="font-mono text-sm">{sources.length}</span> kilder
          </p>
          <div className="fiber-line mt-3 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSources(!showSources)}
            className={`px-3 py-2.5 text-sm rounded-lg border transition-all flex items-center gap-2
                       ${showSources ? "border-fiber/30 text-fiber bg-fiber/5" : "border-b-subtle text-muted hover:text-t-bright hover:border-border"}`}>
            <Settings2 size={15} /> Kilder
          </button>
          <button onClick={handleFetchAll} disabled={fetching}
            className="btn-fiber px-4 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
            {fetching ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {fetching ? "Henter..." : "Oppdater"}
          </button>
        </div>
      </div>

      {/* Sources panel */}
      {showSources && (
        <div className="card-panel p-4 animate-slide-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-heading flex items-center gap-2">
              <Rss size={16} className="text-fiber" /> RSS-kilder
            </h3>
            <button onClick={() => setSourceModal({ open: true, source: null })}
              className="text-sm text-fiber hover:text-fiber/80 transition-colors flex items-center gap-1">
              <Plus size={14} /> Legg til
            </button>
          </div>
          <div className="space-y-2">
            {sources.map(src => (
              <div key={src.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface/30 hover:bg-surface/50 transition-colors group">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${src.enabled ? "bg-signal" : "bg-muted/30"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-t-bright font-medium">{src.name}</span>
                    <span className={`text-[0.5rem] font-mono px-1 py-0.5 rounded border ${
                      src.sourceType === "sitemap" ? "bg-info/10 text-info border-info/20" : "bg-surface text-muted border-b-subtle"
                    }`}>
                      {src.sourceType === "sitemap" ? "SITEMAP" : "RSS"}
                    </span>
                    {src.category && (
                      <span className={`text-[0.55rem] font-mono px-1.5 py-0.5 rounded border ${categoryColors[src.category] || "bg-surface text-muted border-b-subtle"}`}>
                        {src.category}
                      </span>
                    )}
                  </div>
                  <span className="text-[0.65rem] text-muted font-mono truncate block">{src.url}</span>
                </div>
                {src.lastFetchedAt && (
                  <span className="text-[0.6rem] text-muted/50 flex-shrink-0">{timeAgo(src.lastFetchedAt)} siden</span>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setSourceModal({ open: true, source: src })}
                    className="p-1 rounded text-muted hover:text-fiber transition-colors" title="Rediger">
                    <Settings2 size={13} />
                  </button>
                  <button onClick={() => handleDeleteSource(src.id)}
                    className="p-1 rounded text-muted hover:text-danger transition-colors" title="Slett">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <p className="text-muted text-sm text-center py-4">Ingen kilder lagt til enda</p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap animate-slide-in-up stagger-1">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Søk i nyheter..."
            className="w-full pl-9 pr-3 py-2 bg-panel border border-b-subtle rounded-lg text-t-bright text-sm focus:outline-none focus:border-fiber/40 transition-colors placeholder:text-muted/50" />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1">
          <Filter size={13} className="text-muted mr-1" />
          {["Teknisk", "Regulatorisk", "Marked"].map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-mono transition-all border
                         ${categoryFilter === cat
                  ? `${categoryColors[cat]} border-current`
                  : "border-b-subtle text-muted hover:text-t-default hover:border-border"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Bookmarks toggle */}
        <button onClick={() => setShowBookmarked(!showBookmarked)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-mono transition-all border flex items-center gap-1.5
                     ${showBookmarked
              ? "bg-warn/10 text-warn border-warn/20"
              : "border-b-subtle text-muted hover:text-warn hover:border-warn/20"}`}>
          <BookmarkCheck size={12} /> Bokmerket
        </button>
      </div>

      {/* Articles */}
      <div className="space-y-2 animate-slide-in-up stagger-2">
        {filteredArticles.length > 0 ? (
          filteredArticles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              onToggleBookmark={() => handleToggleBookmark(article.id)}
              onOpenNotes={() => setNotesModal(article)}
              onMarkRead={() => handleMarkRead(article.id)}
            />
          ))
        ) : (
          <div className="text-center py-12 card-panel">
            <Rss size={32} className="mx-auto text-muted/40 mb-3" />
            <p className="text-muted">
              {articles.length === 0
                ? "Ingen artikler enda. Klikk «Oppdater» for å hente nyheter."
                : "Ingen artikler matcher filteret"}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {sourceModal.open && (
        <SourceModal source={sourceModal.source} onSave={handleSaveSource} onClose={() => setSourceModal({ open: false, source: null })} />
      )}
      {notesModal && (
        <NotesModal article={notesModal} onSave={handleSaveNotes} onClose={() => setNotesModal(null)} />
      )}
    </div>
  );
}
