export function LoadingBar() {
  return (
    <div className="w-full h-1 bg-muted overflow-hidden">
      <div className="h-full bg-primary animate-loading-bar origin-left"></div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] gap-4">
      <div className="w-64">
        <LoadingBar />
      </div>
    </div>
  );
}
