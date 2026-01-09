import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getBook, createReadingList, createReview } from '@/services/api';
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

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, [id, navigate]);

  const handleAddToList = async () => {
    if (!book) return;

    if (!user) {
      alert('You must be logged in to add books to your reading list.');
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

  const handleWriteReview = () => {
    if (!user) {
      alert('You need to log in to write a review.');
      return;
    }
    setShowReviewForm(true);
  };

  const handleSubmitReview = async () => {
    if (!user || !book) return;

    if (!comment.trim()) {
      alert('Please write a comment.');
      return;
    }

    try {
      setIsSubmitting(true);

      await createReview({
        bookId: book.id,
        userId: user.id,
        username: user.username ?? user.email ?? 'Anonymous',
        rating,
        comment,
      });

      alert('Review submitted successfully!');
      setComment('');
      setRating(5);
      setShowReviewForm(false);
    } catch (err) {
      handleApiError(err);
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">

        <button
          onClick={() => navigate(-1)}
          className="mb-8 text-slate-600 hover:text-violet-600"
        >
          ← Back
        </button>

        <div className="rounded-3xl shadow-2xl border p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full rounded-2xl shadow"
                onError={(e) => {
                  e.currentTarget.src = '/no-cover.png';
                }}
              />
            </div>

            <div className="md:col-span-2">
              <h1 className="text-4xl font-extrabold mb-3">{book.title}</h1>
              <p className="text-xl text-slate-600 mb-6">by {book.author}</p>

              <div className="flex gap-4 mb-6 text-slate-700">
                <span className="font-bold">{formatRating(book.rating)}</span>
                <span>{book.genre}</span>
                <span>{book.publishedYear}</span>
              </div>

              <p className="mb-8 text-slate-700">{book.description}</p>

              <div className="flex gap-4">
                <Button onClick={handleAddToList}>
                  Add to Reading List
                </Button>
                <Button variant="outline" onClick={handleWriteReview}>
                  Write a Review
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEW FORM */}
        {showReviewForm && (
          <div className="mt-8 p-6 border rounded-xl bg-white shadow">
            <h2 className="text-2xl font-bold mb-4">Write your review</h2>

            <textarea
              className="w-full border p-3 rounded mb-4"
              placeholder="Your review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <select
              className="border p-2 rounded mb-4"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <Button onClick={handleSubmitReview} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 p-8 border rounded-xl text-center text-slate-600">
          Reviews list coming next...
        </div>

      </div>
    </div>
  );
}
