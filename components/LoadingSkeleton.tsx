const LoadingSkeleton = () => {
  return (
    <div className="h-80 w-full flex items-center justify-center">
<div className="flex flex-row gap-2">
  <div className="w-4 h-4 rounded-full bg-pink-400 animate-bounce"></div>
  <div className="w-4 h-4 rounded-full bg-blue-400 animate-bounce [animation-delay:-.3s]"></div>
  <div className="w-4 h-4 rounded-full bg-purple-300 animate-bounce [animation-delay:-.5s]"></div>
</div>
    </div>
  );
};
export default LoadingSkeleton;
