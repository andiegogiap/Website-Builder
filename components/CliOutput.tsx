
import React, { useRef, useEffect } from 'react';

interface CliOutputProps {
  output: string[];
}

export const CliOutput: React.FC<CliOutputProps> = ({ output }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  return (
    <div className="h-full bg-black text-white p-4 font-mono text-xs overflow-y-auto">
      {output.map((line, index) => (
        <p key={index} className={`whitespace-pre-wrap ${line.startsWith('[ERROR]') ? 'text-red-400' : 'text-green-400'}`}>
          {line}
        </p>
      ))}
      <div ref={endRef} />
    </div>
  );
};
