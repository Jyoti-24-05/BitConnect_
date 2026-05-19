// client/src/hooks/useInfiniteScroll.js
import { useEffect, useRef, useCallback } from "react";

// Calls loadMore() when the sentinel element enters the viewport
const useInfiniteScroll = (loadMore, hasMore, loading) => {
  const sentinelRef = useRef(null);

  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    [loadMore, hasMore, loading]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleObserver, {
      root:       null,
      rootMargin: "100px", // trigger 100px before the bottom
      threshold:  0,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  return sentinelRef; // attach to a <div ref={sentinelRef} /> at the bottom of your list
};
export default useInfiniteScroll;