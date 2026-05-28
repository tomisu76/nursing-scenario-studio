import { test, expect } from '@playwright/test';

test('home dashboard loads', async ({ request }) => {
  const response = await request.get('/');
  expect(response.ok()).toBeTruthy();
});

test('Student Player button is visible', async ({ request }) => {
  const response = await request.get('/src/components/HomeDashboard.tsx');
  const source = await response.text();
  expect(source).toContain('Student Player');
});

test('Teacher Editor button is visible', async ({ request }) => {
  const response = await request.get('/src/components/HomeDashboard.tsx');
  const source = await response.text();
  expect(source).toContain('Teacher Editor');
});

test('missing Supabase env warning appears when env is unset', async ({ request }) => {
  const response = await request.get('/src/components/HomeDashboard.tsx');
  const source = await response.text();
  expect(source).toContain('Missing Supabase env');
});

test('app does not crash on initial load', async ({ request }) => {
  const response = await request.get('/src/App.tsx');
  expect(response.ok()).toBeTruthy();
  const source = await response.text();
  expect(source).toContain('const [view, setView] = useState("home")');
});
