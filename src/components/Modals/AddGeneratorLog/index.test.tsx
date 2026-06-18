import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';

/* ────────────────────────────────────────────────────────────────────────
 * AddGeneratorLog — Engine Start validation around the service schedule.
 *
 * Renders the REAL modal in edit mode (a generatorLog prop) so the service
 * schedule is fetched for generatorTypeId and the read-only Last/Next hours
 * populate — without having to drive the create-mode comboboxes. We then type
 * Engine Start readings and assert the rendered validation messages.
 *
 * Covers the change: the old "Engine Start must be at least the Last Service
 * Hour" hard block is gone (so backlogged pre-service readings save), replaced
 * by a NON-blocking typo warning for implausibly low values. The forward
 * "beyond the Next Service Hour" rule must remain intact (regression guard).
 * ──────────────────────────────────────────────────────────────────────── */

// The modal pulls six slices off the store and dispatches fetch actions in
// effects; none of that is under test, so stub react-redux with a minimal
// state and a no-op dispatch.
const mockState = {
   generator: { IsCreatingGeneratorLog: false },
   item: { departmentItemsList: [] },
   category: { allCategoriesList: [] },
   meeting: { allMeetingsList: [] },
   meetingLocation: { allMeetingLocationsList: [] },
   config: { effective: { generatorDepartmentId: 2 } },
};
jest.mock('react-redux', () => ({
   useDispatch: () => jest.fn(),
   useSelector: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}));

jest.mock('axios');

import AddGeneratorLog from './index';
import type { GeneratorLog } from '@/types';

const LAST_SERVICE_HOUR = 7085;
const NEXT_SERVICE_HOUR = 7285;

const generatorLog = {
   generatorTypeId: 1,
   generatorType: 'Test Generator',
   engineStartHours: '',
   engineOffHours: '',
   dieselLevelOn: '',
   dieselLevelOff: '',
   dieselUnit: 'litres',
   remark: '',
} as unknown as GeneratorLog;

/** Render the modal and wait until the fetched schedule has populated. */
async function renderWithSchedule() {
   (axios.get as jest.Mock).mockResolvedValue({
      data: { data: { lastServiceHour: LAST_SERVICE_HOUR, nextServiceHour: NEXT_SERVICE_HOUR } },
   });
   // js-cookie reads document.cookie; the fetch is gated on an authToken.
   document.cookie = 'authToken=test-token';

   render(<AddGeneratorLog className="" open generatorLog={generatorLog} />);

   // The read-only Last Service Hour cell shows once the schedule resolves.
   await waitFor(() =>
      expect(screen.getByText(`${LAST_SERVICE_HOUR.toFixed(1)} hrs`)).toBeInTheDocument(),
   );
}

/** The Eng. Start hour-meter input has no accessible label binding, so reach
 *  it through its label's container (the only <input> in that wrapper). */
function engineStartInput(): HTMLInputElement {
   const label = screen.getByText('Eng. Start*');
   const input = label.parentElement?.querySelector('input');
   if (!input) throw new Error('Eng. Start input not found');
   return input as HTMLInputElement;
}

const BACKLOG_ERROR = /Engine Start must be at least the Last Service Hour/i;
const TYPO_WARNING = /well below this generator's recent service hours/i;
const FORWARD_ERROR = /beyond the Next Service Hour/i;

describe('AddGeneratorLog — Engine Start vs. service schedule', () => {
   it('accepts a backlog reading below the Last Service Hour with no error or warning', async () => {
      await renderWithSchedule();

      // 7000 < 7085 (Last Service Hour) — a genuine pre-service backlog entry.
      fireEvent.change(engineStartInput(), { target: { value: '7000' } });

      expect(screen.queryByText(BACKLOG_ERROR)).not.toBeInTheDocument();
      expect(screen.queryByText(TYPO_WARNING)).not.toBeInTheDocument();
      expect(screen.queryByText(FORWARD_ERROR)).not.toBeInTheDocument();
   });

   it('shows a non-blocking typo warning for an implausibly low reading', async () => {
      await renderWithSchedule();

      // 700 is < 50% of 7085 — an order-of-magnitude slip (700 for 7000).
      fireEvent.change(engineStartInput(), { target: { value: '700' } });

      // Advisory warning is shown...
      expect(screen.getByText(TYPO_WARNING)).toBeInTheDocument();
      // ...but it is NOT the removed hard block, and no red field error fires.
      expect(screen.queryByText(BACKLOG_ERROR)).not.toBeInTheDocument();
      expect(screen.queryByText(FORWARD_ERROR)).not.toBeInTheDocument();
   });

   it('still blocks a reading beyond the Next Service Hour (forward rule intact)', async () => {
      await renderWithSchedule();

      // 7300 > 7285 (Next Service Hour) — must be serviced first.
      fireEvent.change(engineStartInput(), { target: { value: '7300' } });

      expect(screen.getByText(FORWARD_ERROR)).toBeInTheDocument();
      // The forward error wins; the soft typo warning is suppressed.
      expect(screen.queryByText(TYPO_WARNING)).not.toBeInTheDocument();
   });
});
