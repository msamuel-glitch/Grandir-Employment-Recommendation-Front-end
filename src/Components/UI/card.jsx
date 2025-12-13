// SRC/components/ui/card.jsx
export function Card({ children, className }) {
  return (
    <div className={`rounded-xl shadow p-4 bg-white ${className}`}>
      {children}
    </div>
  );
}
