import { Check } from 'lucide-react';

const TRACKER_STEPS = [
  { step: 1, label: "Created", position: "top" },
  { step: 2, label: "Assign Allocation", position: "bottom" },
  { step: 3, label: "Packed", position: "top" },
  { step: 4, label: "Invoiced", position: "bottom" },
  { step: 5, label: "Dispatched", position: "top" },
  { step: 6, label: "Delivered", position: "bottom" },
];

const getCurrentStep = (currShipment) => {
  if (!currShipment?.status || currShipment?.status === "created") {
    if (currShipment?.is_fully_allocated) return 2;
    return 1;
  }
  if (currShipment?.status === "packed") return 3;
  if (currShipment?.status === "invoiced") return 4;
  if (currShipment?.status === "dispatched") return 5;
  if (currShipment?.status === "delivered") return 6;
  return 1;
};

const getSegmentColor = (segmentIndex, currentStep) => {
  // segmentIndex: 0 = line between step1-step2, 1 = line between step2-step3, etc.
  // leftStep = segmentIndex + 1, rightStep = segmentIndex + 2

  const leftStep = segmentIndex + 1;
  const rightStep = segmentIndex + 2;

  // Both left and right circles are completed (green) → green line
  if (leftStep < currentStep && rightStep < currentStep) return '#22c55e';

  // Left circle is completed, right circle is active (blue) → blue line
  if (leftStep < currentStep && rightStep === currentStep) return '#1d4ed8';

  // Left circle is active → blue line going out of active circle
  if (leftStep === currentStep) return '#1d4ed8';

  // Everything else → gray
  return '#d1d5db';
};

const getCircleStyle = (step, currentStep) => {
  const done = step < currentStep;
  const active = step === currentStep;

  if (done) return { bg: '#22c55e', border: '#22c55e', color: '#fff' };
  if (active) return { bg: '#1d4ed8', border: '#1d4ed8', color: '#fff' };
  return { bg: '#fff', border: '#d1d5db', color: '#9ca3af' };
};

const ShipmentTrackerBar = ({ currShipment }) => {
  const currentStep = getCurrentStep(currShipment);
  const totalSteps = TRACKER_STEPS.length;
  const circleSize = 32;
  const halfCircle = circleSize / 2;

  return (
    <div
      style={{
        background: '#EFF6FF',
        borderRadius: '12px',
        padding: '20px 32px',
        margin: '8px 16px',
      }}
    >
      <p style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', marginBottom: '24px' }}>
        Shipment Tracker
      </p>

      {/* Outer wrapper — needed so percentage left/right on lines resolves correctly */}
      <div style={{ position: 'relative' }}>

        {/* Row of circles */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {/* ── Segment lines — positioned absolutely between circles ── */}
          {TRACKER_STEPS.map((_, index) => {
            if (index === totalSteps - 1) return null;

            const segColor = getSegmentColor(index, currentStep);

            // Each circle is at position: (index / (totalSteps-1)) * 100%
            // Line starts at right edge of left circle, ends at left edge of right circle
            const leftPct = (index / (totalSteps - 1)) * 100;
            const rightPct = ((index + 1) / (totalSteps - 1)) * 100;

            return (
              <div
                key={`seg-${index}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  // Start from center of left circle, end at center of right circle
                  // Then subtract half circle from each end so line touches circle edge
                  left: `calc(${leftPct}% + ${halfCircle}px)`,
                  right: `calc(${100 - rightPct}% + ${halfCircle}px)`,
                  height: '2px',
                  backgroundColor: segColor,
                  zIndex: 0,
                  transition: 'background-color 0.3s',
                }}
              />
            );
          })}

          {/* ── Circles + Labels ── */}
          {TRACKER_STEPS.map((s) => {
            const { bg, border, color } = getCircleStyle(s.step, currentStep);
            const done = s.step < currentStep;

            return (
              <div
                key={s.step}
                style={{
                  position: 'relative',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {/* Top label slot */}
                <div
                  style={{
                    height: '20px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {s.position === 'top' && (
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  )}
                </div>

                {/* Circle */}
                <div
                  style={{
                    width: `${circleSize}px`,
                    height: `${circleSize}px`,
                    borderRadius: '50%',
                    border: `2px solid ${border}`,
                    backgroundColor: bg,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {done ? <Check size={13} /> : s.step}
                </div>

                {/* Bottom label slot */}
                <div
                  style={{
                    height: '20px',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {s.position === 'bottom' && (
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShipmentTrackerBar;
// ```

// The key fix for the line issue — the `left`/`right` calculation now correctly uses the **circle's center percentage position** and then subtracts `halfCircle` (16px) from each side:
// ```
// left:  calc(${leftPct}%  + 16px)   ← start at center of left circle, shift right by half
// right: calc(${100 - rightPct}% + 16px)  ← end at center of right circle, shift left by half