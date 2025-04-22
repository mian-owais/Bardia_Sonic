"use client";

import React from "react";
import BookCard from "./BookCard";
import Link from "next/link";
import { Loader2, Library, ArrowUpRight } from "lucide-react";

export default function BookGrid({ books, isLoading }) {
  const getDelayClass = (index) => {
    const delays = ["delay-0", "delay-75", "delay-150", "delay-300"];
    return delays[index % delays.length];
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">
            Discovering books for you...
          </p>
        </div>
      </div>
    );
  }

  if (!books?.length) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Library className="w-14 h-14 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-800 mb-3">No books found</p>
          <p className="text-gray-500 text-sm">
            Try adjusting your search or filters to find what you're looking
            for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
            Featured Collection
          </h2>
          <p className="text-gray-600">
            Displaying {books.length} {books.length === 1 ? "book" : "books"} from our library
          </p>
        </div>
        <Link
          href="/books"
          className="hidden sm:flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
        >
          View all books
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 sm:gap-10">
        {books.map((book, index) => (
          <div
            key={book.id}
            className={`opacity-0 animate-fadeIn ${getDelayClass(index)} group`}
          >
            <Link
              href={`/books/${book.id}`}
              className="block h-full transform-gpu transition-transform hover:scale-[1.015] focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg"
            >
              <BookCard book={book} />
            </Link>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-12 mb-8 flex justify-center">
        <button className="px-8 py-2.5 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2">
          Load more books
        </button>
      </div>
    </div>
  );
}
