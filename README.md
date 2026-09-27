# Tranquil Home Hub

Build a complete Apartment Maintenance Management Portal called "MPS Tranquil".

The application should be production-ready and fully functional.

IMPORTANT:

Keep the code modular and lightweight so it can be generated within approximately 5 Lovable credits.

DO NOT over-engineer.

Use:

- React

- TailwindCSS

- Local Storage only

- No authentication

- No backend

- No Supabase

- No Firebase

Everything should work offline inside the browser.

----------------------------------------------------

DESIGN

Use the attached HTML as the reference for calculations and workflow.

DO NOT copy its UI.

Instead use the attached mobile dashboard image as inspiration.

Design language:

Apple inspired

Glassmorphism

Rounded cards

Blurred backgrounds

Very minimal

Large typography

Soft shadows

White cards

Blue gradient background

Very smooth transitions

Spacing similar to iOS.

The dashboard should feel premium.

----------------------------------------------------

HOME DASHBOARD

Top area

Current Month

Current Date

Month Selector

Progress Ring showing

"Expenses Entered"

Example

72%

Below that

Four cards

Water Bill

Electricity

Watchman

Total Expense

Each card should display

Current value

Small icon

Difference from previous month

----------------------------------------------------

MAIN MODULES

Create only five sections

Dashboard

Water

Electricity

Watchman

History

No extra pages.

Everything should be accessible from a bottom navigation bar.

----------------------------------------------------

WATER MODULE

Input Fields

Month

Kaveri In Reading

Kaveri Out Reading

Borewell In Reading

Borewell Out Reading

BWSSB Bill Amount

Automatically calculate

Kaveri Consumption

Borewell Consumption

Total Water Consumption

Display

Consumption Cards

Water Bill Card

Save Button

Edit Button

Delete Button

----------------------------------------------------

ELECTRICITY MODULE

Fields

Month

Meter Reading Previous

Meter Reading Current

Bill Amount

Automatically calculate

Units Consumed

Store month history.

----------------------------------------------------

WATCHMAN MODULE

Fields

Month

Watchman Salary

Bonus

Extra Expenses

Automatically calculate

Total Watchman Expense

----------------------------------------------------

TOTAL CALCULATION

For every month

Total Monthly Expense

=

Water Bill

+

Electricity Bill

+

Watchman Expense

Display total inside dashboard.

----------------------------------------------------

MONTH HISTORY

Display beautiful cards.

Each card contains

Month

Water Expense

Electricity Expense

Watchman Expense

Grand Total

Edit

Delete

Newest month first.

----------------------------------------------------

ANALYTICS

Dashboard should automatically display

Current Month Total

Previous Month Total

Difference

Average Monthly Expense

Highest Expense Month

Lowest Expense Month

Total Expenses This Year

----------------------------------------------------

LOCAL STORAGE

Every record should automatically save into Local Storage.

When page reloads

Everything should remain.

----------------------------------------------------

EXPORT

Add

Export to CSV

Export Monthly Report PDF

----------------------------------------------------

SEARCH

History page should have

Search by Month

Filter by Year

----------------------------------------------------

SETTINGS

Simple settings page inside dashboard popup

Apartment Name

Default Currency

Number of Flats

These values should also save in Local Storage.

----------------------------------------------------

USER EXPERIENCE

Every form should

Validate inputs

Prevent negative values

Show success toast

Show delete confirmation dialog

----------------------------------------------------

COLOR PALETTE

Primary

#3B82F6

Secondary

#EEF4FF

Background

#F5F7FB

Cards

White

Radius

28px

Buttons

Rounded pill style

Icons

Lucide Icons

----------------------------------------------------

TYPOGRAPHY

SF Pro Display style

Large bold headings

Minimal labels

No tables.

Everything should use cards.

----------------------------------------------------

PERFORMANCE

Component based architecture.

Avoid unnecessary libraries.

Keep bundle small.

Lazy load history page.

----------------------------------------------------

PROJECT STRUCTURE

/components

Dashboard

WaterCard

ElectricityCard

WatchmanCard

HistoryCard

ProgressRing

StatsCard

BottomNavigation

/forms

WaterForm

ElectricityForm

WatchmanForm

/hooks

useLocalStorage

/utils

calculations

exportCSV

exportPDF

/pages

Dashboard

History

----------------------------------------------------

CALCULATION RULES

Water Consumption

Kaveri Consumption

=

Kaveri In

-

Kaveri Out

Borewell Consumption

=

Borewell In

-

Borewell Out

Electricity Units

=

Current Reading

-

Previous Reading

Monthly Total

=

Water Bill

+

Electricity Bill

+

Watchman Expense

Average Monthly Expense

=

Sum of Monthly Totals

/

Number of Months

----------------------------------------------------

Animations

Fade

Scale

Slide

Duration 250ms

Use Framer Motion only if absolutely necessary.

----------------------------------------------------

Generate a complete working application with clean reusable React code.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tranquil-home-buddy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b4fdc13d-d92b-40bc-9de1-6d6ebf7083cc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
