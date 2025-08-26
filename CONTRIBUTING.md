# Contribution Guidelines & Definition of Done

This document outlines the development process and quality standards for the Souk El-Sayarat project. Adhering to these guidelines is mandatory to ensure the stability, quality, and predictability of our application.

## Git Branching Strategy

- **`main`**: This branch represents the production-ready code. Direct pushes are forbidden. Merges only happen from the `develop` branch after a full release cycle.
- **`develop`**: This is the primary integration branch. All feature branches are based on `develop` and are merged back into it. This branch should always be stable and ready for deployment to a staging environment.
- **`feature/*`**: All new features and enhancements must be developed on a `feature` branch. For example, `feature/user-profile-page` or `feature/enhance-search-algorithm`.

## Definition of Done (DoD)

A feature or task is only considered "Done" when it meets all of the following criteria. No pull request will be merged until every item is checked off.

1.  **Clear Requirements:**
    - The business goals of the feature are fully understood and documented in the task description.
    - Acceptance criteria are clear and testable.

2.  **Architectural Review:**
    - The proposed changes have been analyzed for potential impacts on other parts of the system (e.g., performance, security, existing features).
    - The approach aligns with the project's overall architecture.

3.  **Comprehensive Testing (Test-Driven-Development is encouraged):**
    - **Unit Tests:** All new functions, components, and logic are covered by unit tests. Code coverage must not decrease.
    - **Integration Tests:** New components are tested to ensure they work correctly with other parts of the application.
    - **End-to-End (E2E) Tests:** The complete user flow for the feature is covered by an E2E test (e.g., a user can log in, add a car to the marketplace, and see it listed).
    - **Visual Regression Tests:** Automated visual snapshots are taken to confirm there are no unintended UI changes, styling issues, or theme breakages.

4.  **Code Quality & Standards:**
    - The code adheres to the project's ESLint and Prettier configurations. `npm run lint` and `npm run format:check` must pass without errors.
    - The code is well-documented, especially for complex logic.

5.  **No Regressions:**
    - The entire test suite (unit, integration, and E2E) passes successfully, confirming that the new changes have not broken any existing functionality.

6.  **Peer Review:**
    - The pull request has been reviewed and formally approved by at least one other team member.
    - All review comments have been addressed and resolved.
