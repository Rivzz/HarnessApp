# CLAUDE.md - Pomodoro Web Application

This file provides guidance for AI agents working on this project.

## Project Overview

A focused pomodoro timer web application built with vanilla JavaScript, CSS, and HTML. No frameworks - pure web technologies for simplicity and performance.

## Architecture

```
E:/GitHub/HarnessApp/
├── src/
│   ├── index.html              # Main HTML entry point
│   ├── css/
│   │   └── styles.css          # All styles, CSS variables, dark/light themes
│   └── js/
│       ├── timer.js            # Timer module (IIFE) - countdown, sessions, breaks
│       ├── tasks.js            # Tasks module (IIFE) - add, edit, delete, complete
│       ├── settings.js         # Settings module (IIFE) - preferences, persistence
│       └── app.js              # App module (IIFE) - initialization, coordination
├── features_list.json          # Feature backlog with priorities and states
├── test_cases.txt              # Original 50 test cases / feature ideas
├── claude-progress.txt         # Session handoff notes (CRITICAL - always read first)
├── init.sh                     # Development environment setup script
├── package.json                # npm configuration
├── app_spec.txt                # Original project specification
└── .gitignore                  # Git ignore rules
```

## Module Pattern

All JavaScript modules use the IIFE (Immediately Invoked Function Expression) pattern:

```javascript
const ModuleName = (function() {
    // Private state and functions
    let privateVar = ...;

    function privateFunction() { ... }

    // Public API
    return {
        publicMethod,
        anotherMethod
    };
})();
```

## Key Files

| File | Purpose |
|------|---------|
| `claude-progress.txt` | **READ FIRST** - Contains session handoff notes, current state, next steps |
| `features_list.json` | Feature backlog - pick next feature from here based on priority |
| `test_cases.txt` | Reference for feature requirements and acceptance criteria |
| `init.sh` | Setup script - update when adding new dependencies or setup steps |

## Tech Stack

- **HTML5** - Semantic markup, ARIA labels for accessibility
- **CSS3** - Custom properties (variables), flexbox, grid, responsive design
- **Vanilla JS** - ES6+, no frameworks, modular IIFE pattern
- **LocalStorage** - All persistence (settings, tasks, stats)
- **Web Audio API** - Notification sounds

---

## WORKFLOW RULES (MANDATORY)

Every session MUST follow this workflow in order:

### 1. GET BEARINGS

Before any code changes, understand the current state:

```
1. Read claude-progress.txt (contains handoff from previous agent)
2. Read features_list.json (check feature states and priorities)
3. Run: git log --oneline -10 (understand recent commits)
4. Run: git status (check for uncommitted changes)
5. Review any files mentioned in claude-progress.txt
```

Use subagents generously to explore the codebase if needed.

### 2. REGRESSION TEST

Verify existing functionality before making changes:

```
1. Start dev server: npm start
2. Open http://localhost:3000 in browser
3. Test core flows:
   - Timer starts, pauses, resets correctly
   - Timer transitions to break after completion
   - Settings modal opens and saves
   - Tasks can be added, completed, deleted
   - Dark mode toggles correctly
   - Keyboard shortcuts work (Space, R, S)
4. Check browser console for errors
```

Use subagents to verify specific functionality. If anything is broken, fix it BEFORE adding new features.

### 3. PICK NEXT FEATURE

Select the next feature to implement:

```
1. Open features_list.json
2. Find features with state: "standby"
3. Prioritize: high > medium > low
4. Check claude-progress.txt for any specific recommendations
5. Update the feature's state to "in-progress" in features_list.json
```

### 4. INCREMENT AND TEST

Implement the feature with continuous testing:

```
1. Make small, incremental changes
2. Test in browser after each change
3. Check for:
   - Visual correctness
   - Functional correctness
   - No console errors
   - No regressions to existing features
4. Use browser DevTools to debug issues
```

### 5. UPDATE AND COMMIT

Commit the completed feature:

```
1. Update feature state to "completed" in features_list.json
2. Stage specific files (avoid git add -A)
3. Write clear commit message describing the feature
4. Commit with: git commit -m "feat: description"
```

### 6. LOG HANDOFF NOTES

Update claude-progress.txt for the next agent:

```
1. Add session date
2. Document what was completed
3. Note any issues encountered
4. List recommended next steps
5. Update "Current Application State" section if needed
6. Update "Known Limitations" if any were addressed or discovered
```

### 7. UPDATE INIT.SH

Align init.sh with any new requirements:

```
1. If new dependencies added -> add npm install commands
2. If new directories needed -> add mkdir commands
3. If new setup steps required -> document them
4. Keep the script idempotent (safe to run multiple times)
```

---

## Feature Implementation Guidelines

### Adding New Features

1. Check `features_list.json` for the feature's `goal` field - it contains implementation instructions
2. Cross-reference with `test_cases.txt` for acceptance criteria
3. Follow existing code patterns and module structure
4. Add to existing modules when possible; create new modules only if necessary

### Code Style

- Use `const` for constants, `let` for variables (never `var`)
- Use meaningful variable/function names
- Keep functions small and focused
- Add comments only where logic isn't self-evident
- Use CSS custom properties for any new colors/spacing

### Testing Checklist

Before considering a feature complete:

- [ ] Works in Chrome
- [ ] Works in Firefox (if possible to test)
- [ ] No console errors
- [ ] Responsive on mobile viewport
- [ ] Dark mode compatible
- [ ] Keyboard accessible
- [ ] Doesn't break existing features

---

## Quick Commands

```bash
# Start development server
npm start

# Check git status
git status

# View recent commits
git log --oneline -10

# View feature backlog
cat features_list.json | grep -A3 '"state": "standby"'
```

---

## Common Patterns

### Adding a Setting

1. Add default value in `settings.js` defaults object
2. Add form input in `index.html` settings modal
3. Add to `populateForm()` and `saveFromForm()` in `settings.js`
4. Use `Settings.get().newSetting` to access

### Adding a Stat

1. Add to stats object in `app.js`
2. Update `loadStats()`, `saveStats()`, `updateStatsDisplay()`
3. Add display element in `index.html` stats section
4. Update `checkDateReset()` if it should reset daily

### Modifying Timer Behavior

1. Changes go in `timer.js`
2. Update `state` object if new state is needed
3. Update relevant functions (start, pause, tick, handleTimerEnd)
4. Expose via public API if other modules need access

---

## Important Notes

- **No frameworks** - Keep it vanilla JS
- **No build step** - Files are served directly
- **LocalStorage only** - No backend/cloud sync
- **Accessibility matters** - Use ARIA labels, keyboard support
- **Mobile first** - Test responsive design

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Timer not starting | Check console for JS errors, verify DOM elements exist |
| Settings not saving | Check localStorage in DevTools, verify keys match |
| Styles not updating | Hard refresh (Ctrl+Shift+R), check CSS syntax |
| Module undefined | Check script load order in index.html |

---

*Last updated: 2026-02-03*
