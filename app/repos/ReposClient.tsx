"use client";

import { useTheme } from "@/lib/theme";
import { formatRelative } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  htmlUrl: string;
  language: string;
  stargazers_count: number;
  private: boolean;
  fork: boolean;
  archived: boolean;
  updatedAt: string;
}

export default function ReposPage() {
  const router = useRouter();
  const { toggle } = useTheme();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [cacheTime, setCacheTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"updated" | "stars" | "name">("updated");

  useEffect(() => {
    const onChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
    };
  }, []);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setError("");
        const res = await fetch("/api/repos");
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = (await res.json()) as Repo[];
        setRepos(data);
        setCacheTime(Date.now());
      } catch (err) {
        setError("Failed to load repositories");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepos();
  }, [router]);

  const normalizedQuery = query.trim().toLowerCase();
  const languages = Array.from(new Set(repos.map((repo) => repo.language).filter(Boolean))).sort(
    (left, right) => left.localeCompare(right)
  );

  const filteredRepos = repos
    .filter((repo) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        repo.name.toLowerCase().includes(normalizedQuery) ||
        repo.full_name.toLowerCase().includes(normalizedQuery) ||
        repo.description.toLowerCase().includes(normalizedQuery);
      const matchesLanguage = languageFilter === "all" || repo.language === languageFilter;
      return matchesQuery && matchesLanguage;
    })
    .sort((left, right) => {
      if (sortBy === "stars") {
        return right.stargazers_count - left.stargazers_count;
      }
      if (sortBy === "name") {
        return left.full_name.localeCompare(right.full_name);
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const activeFilters = Number(Boolean(normalizedQuery)) + Number(languageFilter !== "all");

  if (isLoading && repos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              Shipwright
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading repositories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-400">
            Shipwright
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggle}
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
            >
              🌓
            </button>
            <a
              href="/api/auth/signout"
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Sign Out
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Your Repositories</h1>
          <p className="text-slate-400">
            Select a repository to analyze and prepare for deployment
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="card">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Repositories</p>
            <p className="text-3xl font-semibold text-white">{filteredRepos.length}</p>
            <p className="text-sm text-slate-400">
              {activeFilters > 0 ? `filtered from ${repos.length}` : "ready to ship"}
            </p>
          </div>
          <div className="card">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Languages</p>
            <p className="text-3xl font-semibold text-white">{languages.length}</p>
            <p className="text-sm text-slate-400">distinct stacks detected</p>
          </div>
          <div className="card">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Stars</p>
            <p className="text-3xl font-semibold text-white">{totalStars}</p>
            <p className="text-sm text-slate-400">across visible repositories</p>
          </div>
        </div>

        <div className="card mb-8">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-slate-500">Search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a repository by name, owner, or description"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wider text-slate-500">Language</span>
              <select
                value={languageFilter}
                onChange={(event) => setLanguageFilter(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-blue-500"
              >
                <option value="all">All languages</option>
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wider text-slate-500">Sort</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as "updated" | "stars" | "name")}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-blue-500"
              >
                <option value="updated">Recently updated</option>
                <option value="stars">Most stars</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
        </div>

        {!isOnline && (
          <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-8 text-yellow-200">
            You're offline — displaying cached data if available.
          </div>
        )}
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-8 text-red-200">
            <div className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-sm text-red-100 underline underline-offset-4"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {cacheTime && !isLoading && (
          <p className="text-xs text-slate-400 mb-4">
            Cached {formatRelative(new Date(cacheTime).toISOString())}
            {isLoading && " (updating...)"}
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("repos");
                localStorage.removeItem("reposTimestamp");
                setIsLoading(true);
                setRepos([]);
                router.refresh();
              }}
              className="ml-2 text-blue-400 hover:underline"
            >
              Refresh
            </button>
          </p>
        )}

        {repos.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-400 mb-4">No repositories found</p>
            <p className="text-slate-500 text-sm">Create a repository on GitHub to get started</p>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-300 mb-2">No repositories match the current filters.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLanguageFilter("all");
                setSortBy("updated");
              }}
              className="text-sm text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {isLoading && <div className="card animate-pulse h-40" />}
            {filteredRepos.map((repo) => (
              <div key={repo.id} className="card group transition-colors hover:border-blue-500">
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => router.push(`/repos/${repo.full_name}`)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                        {repo.name}
                      </h3>
                      {repo.private && (
                        <span className="rounded-full bg-slate-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                          Private
                        </span>
                      )}
                      {repo.fork && (
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                          Fork
                        </span>
                      )}
                      {repo.archived && (
                        <span className="rounded-full bg-amber-900/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                      {repo.full_name}
                    </p>
                    <p className="text-slate-400 mt-2">{repo.description || "No description"}</p>
                    <div className="flex gap-4 mt-4 text-sm text-slate-500 flex-wrap">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          {repo.language}
                        </span>
                      )}
                      {repo.stargazers_count > 0 && <span>⭐ {repo.stargazers_count}</span>}
                      <span>Updated {formatRelative(repo.updatedAt)}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      GitHub
                    </a>
                    <div className="text-2xl group-hover:scale-110 transition-transform">→</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
