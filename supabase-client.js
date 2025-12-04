// هذا الملف هو المصدر الوحيد للاتصال بـ Supabase
const SUPABASE_URL = 'https://nvfreqhmeprztpahfnft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZnJlcWhtZXByenRwYWhmbmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njc1NTgsImV4cCI6MjA4MDM0MzU1OH0.pV9Ud-wltZJjryISJgqQRGfQU3X1frYTrrHJr5ymj4Y';

// نقوم بإنشاء متغير supabase ليكون متاحًا لكل الملفات الأخرى
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);