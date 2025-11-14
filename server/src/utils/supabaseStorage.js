import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Upload file to Supabase storage
export const uploadToSupabase = async (file, userId) => {
  try {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${randomString}.pdf`;
    const filePath = `users/${userId}/documents/${fileName}`;

    const { data, error } = await supabase.storage
      .from('pdf-documents') // Changed from 'documents'
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      path: data.path,
      fullPath: filePath,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
};

// Get public URL (for public buckets)
export const getSignedUrl = async (filePath, expiresIn = 3600) => {
  try {
    // Get public URL
    const { data } = supabase.storage
      .from('pdf-documents') // Changed from 'documents'
      .getPublicUrl(filePath);

    console.log('Generated URL:', data.publicUrl);

    return {
      success: true,
      signedUrl: data.publicUrl,
    };
  } catch (error) {
    console.error('Error getting URL:', error);
    return { success: false, error: error.message };
  }
};

// Delete file from Supabase storage
export const deleteFromSupabase = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('pdf-documents') // Changed from 'documents'
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }
};