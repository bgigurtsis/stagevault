# StageVault Integrated UX Plan

## Core User Flows

### 1. Guided Hierarchical Flow (Primary Path)
```
Performance → Rehearsal → Recording
```
- **Enhanced with**: Clear next-step prompts, contextual guidance, and visual cues
- **For**: New users and structured documentation

### 2. Contextual Quick Recording Flow (Secondary Path)
```
Any entry point → Quick Record → Associate → Upload
```
- **Enhanced with**: Context selection during or after recording 
- **For**: Returning users who need speed and flexibility

## Pages Structure & Features

### Dashboard Page
- **Recent sections for all three entities**:
  - Recent Performances
  - Recent Rehearsals (currently missing)
  - Recent Recordings
- **Quick action buttons**:
  - "Quick Record" (prominent)
  - New Performance
  - New Rehearsal
- **Storage/upload status indicators**

### Performance Pages

#### 1. Performances List
- **Visual display options**: Grid, list, calendar
- **Filtering**: By date, status, tags
- **Status indicators**: Upcoming, active, past
- **Quick-add rehearsal** from any performance card
- **Quick-record** option from any performance card

#### 2. Performance Detail
- **Performance metadata** with visual elements
- **Rehearsals section** with chronological listing
- **Prominent CTA**: "Schedule a Rehearsal" button
- **Next-step guidance**: If no rehearsals, prompt to create first one
- **Recordings section**: Show recordings across all rehearsals for this performance
- **Quick actions**:
  - "Record for this performance" (creates temporary rehearsal if needed)
  - "Schedule multiple rehearsals" (batch creation)
  - "Edit performance"

#### 3. New/Edit Performance
- **Simplified form** focusing on essential information
- **Date range selection** with visual calendar
- **Team member/performer selection**
- **After-save guidance**: "Would you like to schedule your first rehearsal now?"

### Rehearsal Pages

#### 1. Rehearsals List
- **Grouping**: By performance or chronological
- **View options**: List, calendar
- **Filtering**: By performance, date, status
- **Quick actions** on each card:
  - "Record"
  - "View recordings"

#### 2. Rehearsal Detail
- **Rehearsal information** with performance context
- **Prominent recording button** at top of page
- **Recordings grid** with preview thumbnails and metadata
- **Next-step guidance**: If no recordings, prompt to record first one
- **Performance link** for easy navigation back to parent
- **Quick actions**:
  - "Record now"
  - "Upload existing recordings"
  - "Edit rehearsal"

#### 3. New/Edit Rehearsal
- **Performance selector** (pre-filled if coming from a performance)
- **Date/time and location emphasis**
- **Rehearsal type/focus field**
- **Participant selector**
- **Recurring options**: "Create weekly rehearsals" checkbox with end date
- **After-save guidance**: "Ready to record your first video for this rehearsal?"

### Recording Pages

#### 1. Quick Record (New Dedicated Page)
- **Phase 1: Context Selection** (if not coming from rehearsal)
  - Quick performance/rehearsal selector
  - Option to create new performance/rehearsal
  - "Record now, organize later" option
- **Phase 2: Full-Screen Recording**
  - Minimal UI during recording
  - Camera/mic selection
  - Clear record/pause/stop controls
  - Recording timer
  - For mobile: Truly full-screen experience
- **Phase 3: Preview/Review**
  - Immediate playback of recording
  - Keep/discard options
  - Basic trimming tools
- **Phase 4: Metadata**
  - Title, tags, notes
  - Performance/rehearsal association (pre-filled if from context)
  - Upload options
- **Phase 5: Upload Progress**
  - Visual progress indicator
  - Background upload option
  - "Continue using app" message

#### 2. Recording Detail
- **Large video player**
- **Complete metadata**
- **Context information**: Which rehearsal/performance
- **Editing options**
- **Sharing options**: Download, direct link, etc.
- **Related recordings** from same rehearsal
- **Navigation**: Next/previous recording in rehearsal

#### 3. Batch Recordings Management
- **Grid view** of recordings
- **Filtering options**: Unorganized, by date, etc.
- **Drag-and-drop interface** to assign to performances/rehearsals
- **Bulk edit options**: Tags, notes, delete
- **Upload status indicators**

### Supporting Pages

#### 1. Profile/Settings
- **User information**
- **Google Drive connection** status and management
- **Storage usage** statistics and cleanup options
- **Default preferences** for recording (camera, quality)
- **Notification settings**

#### 2. Visual Timeline/Calendar
- **Integrated view** showing all entities
- **Color coding** by entity type
- **Filtering options**
- **Click-through** to details
- **Add new items** directly from timeline

#### 3. Wizard Mode (for new users)
- **Step-by-step guide** through entire flow
- **Interactive tutorial** explaining relationships
- **Sample data option** to demonstrate the app
- **Can be dismissed** or recalled from settings

## Entry Points & Navigation

### Global Navigation
- **Persistent sidebar** with main sections
- **Global "Quick Record" button** always accessible
- **Breadcrumb navigation** showing hierarchy
- **Search functionality** across all entities

### Contextual Entry Points
1. **From Dashboard**:
   - "Quick Record" → Context selector → Recording interface
   - Performance card → Performance detail
   - Rehearsal card → Rehearsal detail
   - Recording card → Recording playback

2. **From Performance Detail**:
   - "Schedule Rehearsal" → New rehearsal form (performance pre-filled)
   - "Record for this Performance" → Context selector (performance pre-filled) → Recording interface
   - Rehearsal card → Rehearsal detail

3. **From Rehearsal Detail**:
   - "Record Now" → Recording interface (all context pre-filled)
   - Recording thumbnail → Recording playback

### Cross-Entity References
- **Performance detail**: Shows all rehearsals and recordings
- **Rehearsal detail**: Shows parent performance and all recordings
- **Recording detail**: Shows parent rehearsal and performance
- **Related items** sections on all detail pages

## Mobile-Specific Enhancements

### Recording Interface
- **Truly full-screen** during recording phase
- **Simplified controls** optimized for touch
- **Step-by-step wizard** approach
- **Storage/bandwidth awareness** options

### Navigation
- **Bottom tab bar** for main sections
- **Swipe gestures** between related items
- **Collapsed metadata sections** expandable on demand
- **Floating action button** for quick record

### Responsive Adjustments
- **Single column layout** on small screens
- **Card-based UI** scales well across devices
- **Prioritized information** for small screens
- **Touch-friendly hit targets**

## Implementation Priorities

### Phase 1: Foundation Improvements
1. **Enhance Dashboard** with all three entity types and quick actions
2. **Add next-step guidance** after creation of each entity
3. **Implement full-screen mobile recording** experience
4. **Improve performance-rehearsal-recording relationship visualization**

### Phase 2: New User Experience
1. **Create wizard mode** for new users
2. **Implement guided flow** with prompts
3. **Add sample data option** for demonstration
4. **Enhance onboarding** for Google Drive connection

### Phase 3: Power User Features
1. **Implement batch operations** for rehearsals and recordings
2. **Add quick recording** from multiple entry points
3. **Create visual timeline/calendar view**
4. **Implement advanced search and filtering**

### Phase 4: Refinements
1. **Optimize for mobile performance**
2. **Implement background uploads**
3. **Add offline capability**
4. **Create sharing and collaboration features**

## Key Success Metrics

- **Recording initiation time**: How quickly can users start recording?
- **Completion rate**: Do users successfully complete the entire flow?
- **Organization rate**: Are recordings being properly associated with rehearsals/performances?
- **User satisfaction**: Measured through feedback and usability testing
- **Return usage**: Do users come back and continue using the structured approach?