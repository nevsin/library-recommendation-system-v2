import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getBook, createReadingList } from '@/services/api';
import type { Book } from '@/types';
import { formatRating } from '@/utils/formatters';
import { handleApiError } from '@/utils/errorHandling';
import { useAuth } from '@/hooks/useAuth';

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getBook(id);
        if (!data) {
          navigate('/404');
          return;
        }
        setBook(data);
      } catch (err) {
        handleApiError(err);
        setBook(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddToList = async () => {
    if (!book) return;

    if (!user) {
      alert('You must be logged in');
      return;
    }

    try {
      await createReadingList({
        userId: user.id,
        name: 'My Reading List',
        bookIds: [book.id],
      });
      alert('Book added to reading list!');
    } catch (err) {
      handleApiError(err);
      alert('Failed to add book to reading list');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-600 hover:text-violet-600 mb-8 transition-colors group glass-effect px-4 py-2 rounded-xl border border-white/20 w-fit"
        >
          <svg
            className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold">Back</span>
        </button>

        <div className="glass-effect rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 md:p-12">
            <div className="md:col-span-1">
              <div className="relative group">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full rounded-2xl shadow-2xl group-hover:shadow-glow transition-all duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x400?text=No+Cover';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-violet-900/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="md:col-span-2">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 leading-tight">
                {book.title}
              </h1>
              <p className="text-xl text-slate-600 mb-6 font-medium">by {book.author}</p>

              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="flex items-center bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-xl border border-amber-200 shadow-sm">
                  <svg className="w-5 h-5 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-lg font-bold text-amber-700">{formatRating(book.rating)}</span>
                </div>

                <span className="badge-gradient px-4 py-2 text-sm">{book.genre}</span>

                <div className="flex items-center text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-semibold">{book.publishedYear}</span>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                  <span className="w-1 h-6 bg-gradient-to-b from-violet-600 to-indigo-600 rounded-full mr-3" />
                  Description
                </h2>
                <p className="text-slate-700 leading-relaxed text-lg">{book.description}</p>
              </div>

              <div className="mb-8 glass-effect p-4 rounded-xl border border-white/20">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">ISBN:</span> {book.isbn}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="lg" onClick={handleAddToList}>
                  Add to Reading List
                </Button>
                <Button variant="outline" size="lg">
                  Write a Review
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 glass-effect rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="w-1 h-8 bg-gradient-to-b from-violet-600 to-indigo-600 rounded-full mr-3" />
            Reviews
          </h2>
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">Reviews section coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
