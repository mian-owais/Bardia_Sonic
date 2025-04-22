"use client";

import React from "react";
import { BookOpen, Star, Heart, Share2, MoreHorizontal } from "lucide-react";

export default function BookCard({ book }) {
  const [isLiked, setIsLiked] = React.useState(false);

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      {/* Image Container with Overlay */}
      <div className="h-52 relative overflow-hidden">
        <img
          src={book.cover || "/api/placeholder/240/180"}
          alt={book.title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Action Buttons */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            className="p-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full hover:bg-white hover:text-red-500 hover:scale-110 transition-all duration-300 shadow-sm"
          >
            <Heart
              className={`w-4 h-4 ${
                isLiked ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </button>
          <button 
            onClick={(e) => e.preventDefault()}
            className="p-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full hover:bg-white hover:text-blue-500 hover:scale-110 transition-all duration-300 shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => e.preventDefault()}
            className="p-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full hover:bg-white hover:text-blue-500 hover:scale-110 transition-all duration-300 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Top Right Menu */}
        <button 
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Rating */}
        <div className="flex items-center mb-2.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < (book.rating || 4) 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="ml-2 text-gray-500 text-xs">
            ({book.reviews?.toLocaleString() || "128"})
          </span>
        </div>

        {/* Title & Author */}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[40px] hover:text-blue-600 transition-colors">
  {book.title.length > 30 ? book.title.substring(0, 14) + "..." : book.title}
</h3>
        <p className="text-sm text-gray-600 mb-2.5 line-clamp-1">
          by <span className="hover:text-gray-900 transition-colors">{book.author}</span>
        </p>

        {/* Genre & Year */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
            {book.genre}
          </span>
          <span className="bg-gray-50 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
            {book.year}
          </span>
        </div>

        {/* Description Preview */}
        {book.description && (
          <p className="mt-2.5 text-xs text-gray-500 line-clamp-2">
            {book.description}
          </p>
        )}
      </div>
    </div>
  );
}