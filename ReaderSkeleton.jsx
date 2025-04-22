export default function ReaderSkeleton() {
    return (
      <div className="animate-pulse">
        <div className="flex gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-10 h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
      </div>
    );
  }