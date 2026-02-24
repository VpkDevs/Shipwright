"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  url: string;
  language: string;
  stargazers_count: number;
}

export default function ReposPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch("/api/repos");
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        setRepos(data);
      } catch (err) {
        setError("Failed to load repositories");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepos();
  }, [router]);

  if (isLoading) {
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
          <a
            href="/api/auth/signout"
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Sign Out
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Your Repositories</h1>
          <p className="text-slate-400">
            Select a repository to analyze and prepare for deployment
          </p>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-8 text-red-200">
            {error}
          </div>
        )}

        {repos.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-400 mb-4">No repositories found</p>
            <p className="text-slate-500 text-sm">
              Create a repository on GitHub to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {repos.map((repo) => (
              <Link
                key={repo.id}
                href={`/repos/${repo.full_name}`}
                className="card hover:border-blue-500 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                      {repo.name}
                    </h3>
                    <p className="text-slate-400 mt-2">
                      {repo.description || "No description"}
                    </p>
                    <div className="flex gap-4 mt-4 text-sm text-slate-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {repo.language}
                        </span>
                      )}
                      {repo.stargazers_count > 0 && (
                        <span>⭐ {repo.stargazers_count}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl group-hover:scale-110 transition-transform">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
