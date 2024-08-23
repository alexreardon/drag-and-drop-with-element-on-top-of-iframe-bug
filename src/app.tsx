import React, { useEffect, useRef, useState } from 'react';
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
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

type DropTargetState = 'idle' | 'over-internal' | 'over-external';

const dropTargetStyles: { [Key in DropTargetState]: string } = {
  idle: 'bg-violet-200',
  'over-internal': 'bg-violet-400',
  'over-external': 'bg-violet-400',
};

function DropTarget() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<DropTargetState>('idle');

  useEffect(() => {
    const element = ref.current;

    invariant(element);
    return combine(
      dropTargetForElements({
        element,
        onDragEnter() {
          setState('over-internal');
        },
        onDragLeave() {
          setState('idle');
        },
        onDrop() {
          setState('idle');
        },
      }),
      dropTargetForExternal({
        element,
        onDragEnter() {
          setState('over-external');
        },
        onDragLeave() {
          setState('idle');
        },
        onDrop() {
          setState('idle');
        },
      }),
    );
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

    return draggable({
      element,
      getInitialDataForExternal() {
        return { 'text/plain': 'hello' };
      },
      onGenerateDragPreview() {
        setState('preview');
      },
      onDragStart() {
        setState('dragging');
      },
      onDrop() {
        setState('idle');
      },
    });
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
    return monitorForElements({
      onGenerateDragPreview() {
        setIsDragging(true);
      },
      onDrop() {
        setIsDragging(false);
      }
    })
  }, []);

  // useEffect(() => {
  //   const isInIframe = window.self !== window.top;
  //   function log(event: Event) {
  //     console.log({isInIframe}, event.type, event.target);
  //   }
  //   const eventNames = ['dragstart', 'dragenter', 'dragleave', 'drop', 'dragend'] as const;
  //   return bindAll(window, eventNames.map(eventName => ({ type: eventName, listener: log })));
  // }, []);

  return (
    <>
      <div className="relative flex flex-row gap-3 items-start">
        <iframe
          ref={iframeRef}
          src={isIframeOnSameOrigin ? window.location.href : 'https://atlassian.design'}
          className={(isOver || isDragging) && applyFix ? 'pointer-events-none grayscale' : ''}
          width={600}
          height={600}
        />
        <div
          onMouseEnter={() => setIsOver(true)} onMouseLeave={() => setIsOver(false)}
          className={`bg-slate-200 p-2 rounded border-2 border-black flex flex-col gap-2 ${isOnTop ? 'absolute shadow-lg left-60 top-20' : ''
            }`}
        >
          <span>
            {isOnTop ? <><code>position:absolute</code> element on top</> : <>element beside iframe</>}
          </span>
          <Draggable />
          <div className="flex flex-col h-32">
            <DropTarget />
          </div>
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
