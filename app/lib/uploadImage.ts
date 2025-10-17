import { supabase } from './supabase';

type UploadResult = {
    path: string;
    publicUrl: string;
    signedUrl: string;
    error?: string;
};

type UploadOptions = {
    folder?: string,
    fileName?: string;
    upsert?: boolean;
    contentType?: string;
};

export async function uploadImageToBucket(
    bucket: string,
    file: File,
    opts?: UploadOptions
): Promise<UploadResult> {
    try {
        // Generates a unique filename if not provided
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = opts?.fileName || `${timestamp}-${file.name}`;
        const filePath = opts?.folder ? `${opts.folder}/${fileName}` : fileName;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                upsert: opts?.upsert || false,
                contentType: opts?.contentType || file.type,
            });

        if (error) {
            throw error;
        }  

        // Get the public URL
        const { data: publicUrlData } = await supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        // Get a signed URL (valid for 1 hour by default)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 3600);

        if (signedUrlError || !signedUrlData) {
            throw new Error(signedUrlError?.message || 'Failed to create signed URL')
        }

        return {
            path: data.path,
            publicUrl: publicUrlData.publicUrl,
            signedUrl: signedUrlData.signedUrl,
        };
    } catch (error) {
        console.error('Error uploading image', error);
        return {
            path: '',
            publicUrl: '',
            signedUrl: '',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

export async function uploadUserImage(
    file: File,
    userId: string,
    opts?: Omit<UploadOptions, 'folder'>
): Promise<UploadResult> {
    return uploadImageToBucket('user-images', file, {
        ...opts,
        folder: `users/${userId}`,
    });
}

export async function uploadOutfitImage(
    file: File,
    outfitId: string,
    opts?: Omit<UploadOptions, 'folder'>
): Promise<UploadResult> {
    return uploadImageToBucket('outfit-images', file, {
        ...opts,
        folder: `outfits/${outfitId}`,
    });
}

export async function uploadClothingImage(
    file: File,
    userId: string,
    opts?: Omit<UploadOptions, 'folder'>
): Promise<UploadResult> {
    return uploadImageToBucket('clothing-images', file, {
        ...opts,
        folder: `users/${userId}/clothing`,
    });
}