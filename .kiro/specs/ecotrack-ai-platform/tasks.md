# Implementation Plan: TerraTrack Platform

## Overview

This plan implements the TerraTrack sustainability platform using React, Vite, and Tailwind CSS with AI-powered insights from Gemini API and Firebase Firestore for data persistence. The implementation follows a pure function architecture for core calculations, enabling comprehensive property-based testing with fast-check. The system tracks carbon footprints across five emission categories (Transport, Electricity, Food, Shopping, Water), generates eco scores with four classification tiers, provides AI-generated recommendations and challenges, and implements gamification through progress tracking and achievements.

**Implementation Language:** JavaScript (ES6+)  
**Framework:** React 18+ with Vite  
**UI Framework:** Tailwind CSS  
**Testing:** Vitest + fast-check + React Testing Library  
**External APIs:** Gemini API, Firebase Firestore  

---

## Tasks

- [ ] 1. Project scaffolding and environment setup
  - Initialize Vite + React project with Tailwind CSS
  - Configure environment variables for API keys (Gemini, Firebase)
  - Create .env.example template with required keys
  - Set up project directory structure (components/, services/, utils/, tests/)
  - Install core dependencies: React Router, Chart.js/Recharts, Firebase SDK
  - Configure Vitest with fast-check for property-based testing
  - Set up ESLint and Prettier for code quality
  - Create basic navigation structure with React Router
  - _Requirements: 10.1, 10.4_

- [ ] 2. Emission factors and validation utilities
  - [x] 2.1 Create emission factors constants module
    - Define EMISSION_FACTORS object with all five categories (transport, electricity, food, shopping, water)
    - Document scientific sources (EPA, IPCC) for each emission factor
    - Define VALIDATION_RANGES for numeric inputs
    - Define ECO_SCORE_THRESHOLDS and REFERENCE_FOOTPRINTS
    - Define LEVEL_THRESHOLDS for gamification system
    - _Requirements: 2.3_

  - [ ] 2.2 Implement input validators module
    - Write validateActivityData() function to check all required fields
    - Write validateNumericRange() for bounds checking (non-negative, realistic ranges)
    - Write validateTransportData() for transport-specific validation
    - Write validateElectricityData(), validateFoodData(), validateShoppingData(), validateWaterData()
    - Return descriptive ValidationError objects with field and message
    - Implement input sanitization to prevent injection attacks
    - _Requirements: 1.6, 1.7, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 2.3 Write property test for validation (Property 1, 2, 3, 4)
    - **Property 1: Validation Errors Are Descriptive**
    - **Property 2: Numeric Validation Bounds**
    - **Property 3: Required Field Validation**
    - **Property 4: Input Sanitization**
    - **Validates: Requirements 1.6, 1.7, 11.1, 11.2, 11.3, 11.4**
    - Generate random invalid inputs and verify descriptive error messages
    - Generate numeric values outside bounds and verify rejection
    - Generate inputs with missing required fields and verify detection
    - Generate inputs with malicious patterns and verify sanitization

- [ ] 3. Carbon calculator service (pure functions)
  - [ ] 3.1 Implement core carbon calculation functions
    - Write calculateTransportEmissions(transport) using emission factors
    - Write calculateElectricityEmissions(electricity) using kWh factor
    - Write calculateFoodEmissions(food) with meat consumption, local produce, waste factors
    - Write calculateShoppingEmissions(shopping) with clothing, electronics, recycling
    - Write calculateWaterEmissions(water) using per-liter factor
    - All functions return values formatted to 2 decimal places
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 3.2 Implement calculateCarbonFootprint() orchestrator function
    - Accept complete ActivityData object with all five categories
    - Validate inputs using validators from task 2.2
    - Call individual category calculation functions
    - Sum category emissions for total footprint
    - Return CarbonFootprint object with total and byCategory breakdown
    - Include timestamp in result
    - Handle calculation errors gracefully with try-catch
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 3.3 Write property tests for carbon calculation (Property 6, 7, 8)
    - **Property 6: Carbon Calculation Additivity**
    - **Property 7: Decimal Precision Formatting**
    - **Property 8: Calculation Determinism**
    - **Validates: Requirements 2.1, 2.4, 2.5**
    - Generate random activity data and verify total = sum of categories
    - Verify all emissions formatted to exactly 2 decimal places
    - Verify identical inputs produce identical outputs (determinism)

  - [ ]* 3.4 Write unit tests for carbon calculator
    - Test specific transport modes with known distances and expected emissions
    - Test edge cases: zero emissions (bike/walk), very high values
    - Test food combinations with all meat consumption levels
    - Test shopping with and without recycling
    - Test calculation errors with invalid data structures
    - _Requirements: 2.1, 2.2, 15.1_

- [ ] 4. Eco score calculator service (pure functions)
  - [ ] 4.1 Implement eco score calculation logic
    - Write calculateEcoScore(carbonFootprint) function
    - Implement inverse scoring algorithm (lower emissions = higher score)
    - Use REFERENCE_FOOTPRINTS to map emissions to 0-100 scale
    - Ensure score always in range [0, 100]
    - _Requirements: 3.1_

  - [ ] 4.2 Implement classification and messaging
    - Write classifyEcoScore(score) function with four tiers
    - Return 'Green Hero' for 90-100, 'Eco Friendly' for 70-89
    - Return 'Needs Improvement' for 50-69, 'High Impact' for 0-49
    - Write getScoreMessage(classification) for motivational messages
    - Write getScoreColor(classification) for UI display colors
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.3 Write property tests for eco score (Property 9)
    - **Property 9: Eco Score Correctness**
    - **Validates: Requirements 3.1, 3.6**
    - Generate random footprint values and verify score in [0, 100]
    - Verify classification boundaries are correct
    - Verify determinism (same footprint = same score)
    - Verify consistent scoring across all users

  - [ ]* 4.4 Write unit tests for eco score calculator
    - Test all classification boundary values (0, 49, 50, 69, 70, 89, 90, 100)
    - Test edge case: zero footprint should give score 100
    - Test edge case: extremely high footprint still gives valid score
    - Test motivational messages for each classification
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 15.2_

- [ ] 5. Checkpoint - Core calculation services complete
  - Ensure all tests pass for validation, carbon calculator, and eco score calculator
  - Verify 90%+ code coverage for these services
  - Ask the user if questions arise

- [ ] 6. Gemini API service integration
  - [ ] 6.1 Implement Gemini API client wrapper
    - Create geminiService.js with API configuration
    - Read VITE_GEMINI_API_KEY from environment variables
    - Implement makeGeminiRequest(prompt, options) base function
    - Add timeout handling (5s for chatbot, 10s for recommendations)
    - Implement exponential backoff retry logic (3 attempts)
    - Log all API errors with context
    - _Requirements: 10.1, 10.2, 10.5_

  - [ ] 6.2 Implement AI recommendation generation
    - Write generateRecommendations(carbonFootprint) function
    - Construct Gemini prompt with footprint data and category breakdown
    - Parse API response into Recommendation[] format
    - Sort recommendations by priority (highest emission categories first)
    - Calculate estimatedSavings for each recommendation
    - Return fallback recommendations on API failure
    - _Requirements: 4.1, 4.3, 4.6_

  - [ ] 6.3 Implement AI challenge generation
    - Write generateChallenges(userLevel, completedChallenges) function
    - Construct Gemini prompt requesting 3+ weekly challenges
    - Parse API response into Challenge[] format with criteria, points, duration
    - Assign point values based on difficulty (easy: 10-20, medium: 30-50, hard: 60-100)
    - Return at least 3 distinct challenge types
    - _Requirements: 7.1, 7.2, 7.3, 7.6_

  - [ ] 6.4 Implement AI sustainability chatbot
    - Write chatWithAI(messages, newMessage) function
    - Maintain conversation context with message history
    - Implement topic redirection for off-topic questions
    - Return responses within 5 seconds
    - Handle API unavailability with graceful message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.5 Write property tests for error handling (Property 11, 17)
    - **Property 11: Error Handling with Graceful Fallback**
    - **Property 17: API Key Format Validation**
    - **Validates: Requirements 4.5, 10.5**
    - Simulate API errors and verify fallback messages returned
    - Verify errors logged but not exposed to users
    - Verify API key format validation before calls

  - [ ]* 6.6 Write integration tests for Gemini service
    - Mock Gemini API with MSW
    - Test successful recommendation generation
    - Test successful challenge generation
    - Test chatbot conversation flow
    - Test error handling and retries
    - Test timeout behavior
    - _Requirements: 4.5, 5.5, 15.3_

- [ ] 7. Firebase Firestore service integration
  - [ ] 7.1 Initialize Firebase and create service wrapper
    - Configure Firebase with credentials from environment
    - Initialize Firestore instance
    - Create firebaseService.js module
    - Implement database connection validation on startup
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 7.2 Implement user profile operations
    - Write createUserProfile(userId, email) function
    - Write updateUserProfile(userId, updates) function
    - Write getUserProfile(userId) function
    - Implement retry logic with exponential backoff (3 attempts)
    - On final failure, store data in localStorage for later sync
    - _Requirements: 13.2_

  - [ ] 7.3 Implement activity log persistence
    - Write saveActivityLog(userId, activityLog) function
    - Store complete ActivityData, CarbonFootprint, EcoScore, timestamp
    - Associate all data with userId for data isolation
    - Write getActivityLogs(userId, limit) for retrieval
    - Implement write retries and local storage fallback
    - Complete writes within 3 seconds
    - _Requirements: 13.1, 13.2, 13.4, 13.5_

  - [ ] 7.4 Implement challenge progress persistence
    - Write saveChallengeProgress(userId, challengeProgress) function
    - Store challenge completion status and logged actions
    - Write getChallengeHistory(userId) function
    - Update challenge status when completed
    - _Requirements: 7.4, 7.5_

  - [ ]* 7.5 Write property tests for data operations (Property 5, 18, 19)
    - **Property 5: Type Validation Integrity**
    - **Property 18: User Data Association**
    - **Property 19: Database Retry Logic**
    - **Validates: Requirements 11.5, 13.2, 13.4**
    - Generate random data and verify type validation before storage
    - Verify all data correctly associated with userId
    - Simulate write failures and verify retry behavior (up to 3 attempts)

  - [ ]* 7.6 Write integration tests for Firebase service
    - Test saveActivityLog and getActivityLogs roundtrip
    - Test user profile CRUD operations
    - Test challenge progress storage and retrieval
    - Test retry logic with simulated failures
    - Test local storage fallback on permanent failure
    - _Requirements: 13.1, 13.3, 13.4, 13.5, 15.5_

- [ ] 8. Progress tracker and gamification logic
  - [ ] 8.1 Implement level calculation system
    - Write calculateLevel(points) function using LEVEL_THRESHOLDS
    - Write pointsToNextLevel(currentPoints) function
    - Write calculateProgressPercentage(currentPoints) function
    - Return LevelConfig with level number and title
    - _Requirements: 8.2, 8.3_

  - [ ] 8.2 Implement achievement system
    - Define achievement criteria (first challenge, 10 challenges, 100kg saved, etc.)
    - Write checkAchievements(progressData) function
    - Return newly unlocked Achievement[] objects
    - Store achievements in Firestore
    - _Requirements: 8.1_

  - [ ] 8.3 Implement point awarding logic
    - Write awardPoints(userId, points) function
    - Fetch current user profile from Firebase
    - Add points to user total
    - Recalculate level if threshold crossed
    - Update user profile in Firestore
    - Return updated ProgressData
    - Display milestone notifications when level increases
    - _Requirements: 7.4, 8.2, 8.5_

  - [ ]* 8.4 Write property tests for progress tracking (Property 13, 14, 15)
    - **Property 13: Point Assignment Logic**
    - **Property 14: Level Calculation Consistency**
    - **Property 15: Progress Percentage Calculation**
    - **Validates: Requirements 7.3, 8.2, 8.3, 8.4**
    - Verify challenge points assigned within valid ranges
    - Verify level calculation correctness for all point values
    - Verify progress percentage formula accuracy

  - [ ]* 8.5 Write unit tests for progress tracker
    - Test level calculation at each threshold boundary
    - Test pointsToNextLevel calculations
    - Test progress percentage edge cases (at level boundary)
    - Test achievement unlocking criteria
    - _Requirements: 8.2, 8.3, 8.4_

- [ ] 9. Report generator service
  - [ ] 9.1 Implement report data aggregation
    - Write gatherReportData(userId) function
    - Fetch user's latest activity log from Firebase
    - Fetch user's challenge history and achievements
    - Calculate comparison metrics with previous period
    - Identify top 3 emission categories
    - _Requirements: 9.2, 9.3, 9.5_

  - [ ] 9.2 Implement report formatting
    - Write formatReportData(reportData) function
    - Create text format with sections: summary, breakdown, recommendations, progress
    - Highlight highest emission categories
    - Include AI-generated insights from Gemini API
    - Calculate and display percentage change vs previous period
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

  - [ ] 9.3 Implement report generation and download
    - Write generateReport(userId, format) function supporting 'pdf' and 'text'
    - For text format: return formatted string
    - For PDF format: use jsPDF library to create downloadable PDF
    - Trigger browser download with appropriate filename
    - Complete generation within 10 seconds
    - _Requirements: 9.1, 9.6_

  - [ ]* 9.4 Write property tests for report generation (Property 10, 16)
    - **Property 10: Comparison Calculation Accuracy**
    - **Property 16: Report Content Completeness**
    - **Validates: Requirements 6.4, 9.2, 9.3, 9.5**
    - Generate random footprint pairs and verify comparison calculations
    - Verify reports include all required sections (summary, categories, recommendations)

  - [ ]* 9.5 Write unit tests for report generator
    - Test report data aggregation with sample user data
    - Test comparison calculations with known values
    - Test top emission category identification
    - Test report formatting for both text and PDF
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [ ] 10. Checkpoint - Backend services complete
  - Ensure all service layer tests pass (Gemini, Firebase, Progress, Reports)
  - Verify integration tests passing with mocked external services
  - Verify 90%+ code coverage on all services
  - Ask the user if questions arise

- [ ] 11. React UI components - Carbon calculator interface
  - [ ] 11.1 Create CarbonCalculator component with multi-category form
    - Build form with sections for Transport, Electricity, Food, Shopping, Water
    - Add input fields for transport mode (dropdown) and distance (number)
    - Add input field for electricity usage (kWh)
    - Add inputs for meat consumption frequency, local produce checkbox, food waste level
    - Add inputs for new clothes count, electronics count, recycling checkbox
    - Add input for water usage (liters per day)
    - Implement local form state management
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 11.2 Implement form validation and submission
    - Add client-side validation on blur and submit
    - Display field-specific error messages below inputs
    - Highlight invalid fields with red borders
    - Call validateActivityData() from validators module
    - On valid submission, call calculateCarbonFootprint()
    - Save results to Firebase via firebaseService
    - Display loading state during calculation and save
    - Navigate to Dashboard on success
    - _Requirements: 1.6, 1.7, 11.1, 11.2, 11.3, 14.2_

  - [ ] 11.3 Add accessibility features to calculator form
    - Use semantic HTML elements (<form>, <label>, <input>)
    - Associate all labels with inputs using htmlFor
    - Add descriptive aria-labels for complex inputs
    - Implement full keyboard navigation (Tab, Enter, Space)
    - Display visible focus indicators on all inputs
    - Use appropriate input types (number, select, checkbox)
    - _Requirements: 12.1, 12.2, 12.3, 12.6_

- [ ] 12. React UI components - Dashboard and visualizations
  - [ ] 12.1 Create Dashboard component layout
    - Create grid layout with sections: Total Emissions, Category Breakdown, Trends, Eco Score
    - Display total monthly CO₂ in prominent card with kg unit
    - Display eco score with classification badge and color
    - Fetch user's activity logs from Firebase on mount
    - Display loading state during data fetch
    - _Requirements: 6.1, 6.5_

  - [ ] 12.2 Implement category breakdown visualization
    - Install and configure Chart.js or Recharts
    - Create pie chart showing emission breakdown by category
    - Display percentages for each category
    - Use distinct colors for each category
    - Add hover tooltips with kg CO₂ values
    - Format numbers to 2 decimal places
    - _Requirements: 6.2, 6.6_

  - [ ] 12.3 Implement weekly trends chart
    - Create line chart showing emissions over time (past 4 weeks)
    - Fetch historical activity logs from Firebase
    - Plot total emissions per week
    - Display CO₂ saved compared to previous period
    - Add axis labels and legend
    - _Requirements: 6.3, 6.4_

  - [ ] 12.4 Implement dashboard refresh and performance
    - Auto-refresh data when new calculations saved
    - Update visualizations within 2 seconds of data availability
    - Add manual refresh button
    - Optimize chart rendering for performance
    - _Requirements: 6.5, 14.3_

- [ ] 13. React UI components - AI recommendations and chatbot
  - [ ] 13.1 Create AIRecommendations component
    - Fetch recommendations from Gemini service on mount
    - Display loading spinner during API call
    - Display recommendation cards with category, action, estimated savings
    - Show difficulty badges (easy, medium, hard)
    - Sort by priority (highest impact first)
    - Display fallback message if API fails
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

  - [ ] 13.2 Create AIChatbot component
    - Create chat interface with message history display
    - Add input field and send button for user questions
    - Call chatWithAI() from Gemini service
    - Display conversation with user and assistant message bubbles
    - Maintain context across messages in session
    - Show loading indicator while waiting for response
    - Display error message if chatbot unavailable
    - Implement 5-second timeout for responses
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 14. React UI components - Challenges and progress tracking
  - [ ] 14.1 Create Challenges component
    - Fetch weekly challenges from Gemini service
    - Display challenge cards with title, description, criteria, points, duration
    - Add "Complete" button for each challenge
    - Show input for logging sustainability actions
    - Update challenge status in Firebase when completed
    - Award points via awardPoints() function
    - Display challenge completion notification
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 14.2 Create ProgressTracker component
    - Display user's current level and level title
    - Show progress bar with percentage toward next level
    - Display total points and points needed for next level
    - List completed challenges with timestamps
    - Display total CO₂ saved metric
    - Show unlocked achievements with icons
    - Display milestone notifications when level increases
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 15. React UI components - Reports and navigation
  - [ ] 15.1 Create Report component
    - Add "Generate Report" button with format selection (PDF/Text)
    - Call generateReport() from report generator service
    - Display loading state during generation (up to 10 seconds)
    - Trigger browser download when complete
    - Show preview of report content before download
    - Display error message if generation fails
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ] 15.2 Create navigation components (Navbar, Footer)
    - Build Navbar with links: Calculator, Dashboard, Challenges, Reports, Chat
    - Add responsive mobile menu (hamburger icon)
    - Display user's current level in navbar
    - Create Footer with app information and links
    - Implement React Router navigation
    - _Requirements: 14.1_

  - [ ] 15.3 Add global loading indicators and error boundaries
    - Display loading spinner for operations > 1 second
    - Create ErrorBoundary component to catch React errors
    - Display user-friendly error pages
    - Add network status indicator
    - _Requirements: 14.4, 14.5_

- [ ] 16. Checkpoint - UI components complete
  - Ensure all components render without errors
  - Test navigation between all routes
  - Verify data flows from forms through services to Firebase and back to UI
  - Ask the user if questions arise

- [ ] 17. Accessibility compliance and testing
  - [ ] 17.1 Implement WCAG AA compliance across all components
    - Ensure all interactive elements have visible focus indicators
    - Verify color contrast ratios ≥ 4.5:1 for text
    - Add alt text descriptions for all chart visualizations
    - Use semantic HTML throughout (header, nav, main, footer, section)
    - Add skip navigation link for keyboard users
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 17.2 Write accessibility tests
    - Set up jest-axe for automated WCAG testing
    - Test each component for accessibility violations
    - Test form label associations
    - Test keyboard navigation flows
    - Test focus management
    - Document findings and remediate violations
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 18. Property-based testing - Remaining properties
  - [ ]* 18.1 Write property test for recommendation prioritization (Property 12)
    - **Property 12: Recommendation Prioritization**
    - **Validates: Requirements 4.6**
    - Generate footprints with varied category emissions
    - Verify recommendations target highest categories first

- [ ] 19. Performance optimization and testing
  - [ ] 19.1 Optimize component rendering
    - Add React.memo() to expensive components
    - Implement useMemo() for expensive calculations
    - Implement useCallback() for event handlers
    - Add code splitting with React.lazy() for routes
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ]* 19.2 Write performance tests
    - Test calculation response time < 1 second
    - Test page navigation time < 2 seconds
    - Test dashboard rendering time < 3 seconds
    - Measure and document performance metrics
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 20. Integration testing - End-to-end flows
  - [ ]* 20.1 Write integration tests for complete user flows
    - Test flow: Input activity → Calculate → Save → View dashboard
    - Test flow: Generate recommendations → Display → Navigate
    - Test flow: Accept challenge → Log action → Complete → Award points
    - Test flow: Generate report → Download
    - Test flow: Chat with AI → Receive response
    - Test data persistence across page refreshes
    - _Requirements: 15.5_

- [ ] 21. Final testing and coverage verification
  - [ ]* 21.1 Run complete test suite and verify coverage
    - Run all unit tests: `npm run test`
    - Run all property-based tests: `npm run test:properties`
    - Run all integration tests
    - Run accessibility tests
    - Generate coverage report: `npm run test:coverage`
    - Verify ≥90% coverage for Carbon Calculator service
    - Verify ≥90% coverage for Eco Score Calculator service
    - Verify all 19 correctness properties pass with 100 iterations each
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 21.2 Fix any test failures or coverage gaps
    - Address any failing tests
    - Add tests for uncovered code paths
    - Ensure all edge cases tested
    - Document any intentional coverage exclusions

- [ ] 22. Documentation and deployment preparation
  - [ ] 22.1 Create comprehensive documentation
    - Write README.md with project overview, setup instructions, and usage
    - Document environment variable configuration
    - Document emission factor sources and scientific references
    - Create API documentation for all service functions
    - Add inline code comments for complex logic
    - Create user guide for the application

  - [ ] 22.2 Prepare deployment configuration
    - Create production build configuration for Vite
    - Set up environment-specific configs (dev, staging, prod)
    - Configure Firebase security rules for Firestore
    - Test production build locally
    - Create deployment checklist

- [ ] 23. Final checkpoint - Production readiness
  - Ensure all 19 correctness properties pass
  - Verify 90%+ code coverage achieved
  - Verify zero WCAG AA violations
  - Verify all performance requirements met
  - Ensure all documentation complete
  - Ask the user if questions arise or if ready for deployment

---

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task explicitly references specific requirements for traceability
- Property-based tests validate 19 universal correctness properties with 100+ random inputs each
- Checkpoints at tasks 5, 10, 16, and 23 ensure incremental validation
- The implementation follows pure function architecture for testability
- All external API failures (Gemini, Firebase) degrade gracefully with fallbacks
- Accessibility compliance (WCAG AA) is built into component design from the start

---

## Property Test Summary

All 19 correctness properties from the design document are tested:

1. ✅ Property 1: Validation Errors Are Descriptive (Task 2.3)
2. ✅ Property 2: Numeric Validation Bounds (Task 2.3)
3. ✅ Property 3: Required Field Validation (Task 2.3)
4. ✅ Property 4: Input Sanitization (Task 2.3)
5. ✅ Property 5: Type Validation Integrity (Task 7.5)
6. ✅ Property 6: Carbon Calculation Additivity (Task 3.3)
7. ✅ Property 7: Decimal Precision Formatting (Task 3.3)
8. ✅ Property 8: Calculation Determinism (Task 3.3)
9. ✅ Property 9: Eco Score Correctness (Task 4.3)
10. ✅ Property 10: Comparison Calculation Accuracy (Task 9.4)
11. ✅ Property 11: Error Handling with Graceful Fallback (Task 6.5)
12. ✅ Property 12: Recommendation Prioritization (Task 18.1)
13. ✅ Property 13: Point Assignment Logic (Task 8.4)
14. ✅ Property 14: Level Calculation Consistency (Task 8.4)
15. ✅ Property 15: Progress Percentage Calculation (Task 8.4)
16. ✅ Property 16: Report Content Completeness (Task 9.4)
17. ✅ Property 17: API Key Format Validation (Task 6.5)
18. ✅ Property 18: User Data Association (Task 7.5)
19. ✅ Property 19: Database Retry Logic (Task 7.5)

Each property is tested with fast-check library using minimum 100 random iterations per test case.
