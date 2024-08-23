import { useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { bindAll } from 'bind-event-listener';

function InIframe() {
  return (
    <>
      <div className="bg-orange-200 p-2 border-2 border-black rounded flex flex-col gap-2 w-screen h-screen">
        <span>
          In a child <code>iframe</code>
        </span>
        <Draggable />
        <DropTarget />
      </div>
    </>
  );
}

type DropTargetState = 'idle' | 'over'

const dropTargetStyles: { [Key in DropTargetState]: string } = {
  idle: 'bg-violet-200',
  'over': 'bg-violet-400',
};

function DropTarget() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<DropTargetState>('idle');

  useEffect(() => {
    const element = ref.current;

    invariant(element);

    return bindAll(element, [{
      type: 'dragenter',
      listener(event) {
        if (event.target === element) {
          setState('over');
        }
      }
    }, {
      type: 'dragleave',
      listener(event) {
        if (event.relatedTarget instanceof Element && !element.contains(event.relatedTarget)) {
          setState('idle');
        }
      }
    },
    {
      type: 'drop',
      listener(event) {
        setState('idle');
      }
    }
    ]);
  }, []);
  console.log({ isInIframe: window.self !== window.top, state });

  return (
    <div
      ref={ref}
      className={`bg-violet-200 p-2 grow flex flex-col rounded ${dropTargetStyles[state]}`}
    >
      <div>Drop target</div>
      <div>
        (state: <code>{state}</code>)
      </div>
    </div>
  );
}

type DraggableState = 'idle' | 'preview' | 'dragging';

const draggableStyles: { [Key in DraggableState]: string } = {
  idle: 'bg-emerald-200',
  preview: 'bg-emerald-100',
  dragging: 'bg-slate-300',
};

function Draggable() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<DraggableState>('idle');

  useEffect(() => {
    const element = ref.current;

    invariant(element);

    element.draggable = true;

    return bindAll(element, [
      {
        type: 'dragstart',
        listener() {
          setState('preview');
          requestAnimationFrame(() => setState('dragging'));
        }
      },
      {
        type: 'dragend',
        listener() {
          setState('idle');
        }
      }
    ]);

  }, []);
  return (
    <div ref={ref} className={`p-2 rounded cursor-grab ${draggableStyles[state]}`}>
      Draggable element
    </div>
  );
}

function Parent() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isIframeOnSameOrigin, setIsIframeOnSameOrigin] = useState<boolean>(true);
  const [applyFix, setApplyFix] = useState<boolean>(false);
  const [isOnTop, setIsOnTop] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isOver, setIsOver] = useState<boolean>(false);

  useEffect(() => {
    return bindAll(window, [
      {
        type: 'dragstart', listener() {
          setIsDragging(true);
        }
      },
      {
        type: 'dragend', listener() {
          setIsDragging(false);
        }
      }
    ])
  }, []);

  return (
    <>
      <div className="relative flex flex-row gap-20">
        <iframe
          ref={iframeRef}
          src={isIframeOnSameOrigin ? window.location.href : 'https://atlassian.design'}
          className={(isOver || isDragging) && applyFix ? 'pointer-events-none grayscale' : ''}
          width={600}
          height={600}
        />
        <div
          onMouseEnter={() => setIsOver(true)} onMouseLeave={() => setIsOver(false)}
          className={`bg-slate-200 p-2 rounded border-2 border-black flex flex-col gap-2 w-80 h-80 ${isOnTop ? 'absolute shadow-lg left-60 top-20' : ''
            }`}
        >
          <span>
            <code>position:absolute</code> element on top
          </span>
          <Draggable />
          <DropTarget />
          <label className="flex flex-row gap-2">
            <input
              type="checkbox"
              checked={isIframeOnSameOrigin}
              onChange={() => setIsIframeOnSameOrigin(!isIframeOnSameOrigin)}
            />
            Place <code>iframe</code> on same origin?
          </label>
          <label className="flex flex-row gap-2">
            <input type="checkbox" checked={isOnTop} onChange={() => setIsOnTop(!isOnTop)} />
            Place this panel on top?
          </label>
          <label className="flex flex-row gap-2">
            <input type="checkbox" checked={applyFix} onChange={() => setApplyFix(!applyFix)} />
            Apply <code>pointer-events: none</code> fix?
          </label>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const isInIframe = typeof window !== undefined && window.top !== window.self;
  return isInIframe ? <InIframe /> : <Parent />;
}
