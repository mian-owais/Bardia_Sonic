import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="font-bold text-xl text-blue-600">
            Digital Library
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/bookmarks" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Bookmarks
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
