import { storage, auth } from "@/lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
];

export async function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      "File type not allowed. Please upload images, PDFs, documents, or zip files."
    );
  }
}

export async function uploadMilestoneFile(dealId, milestoneIndex, file) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  await validateFile(file);

  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const filePath = `userFiles/${user.uid}/deals/${dealId}/milestone_${milestoneIndex}/${fileName}`;

  const storageRef = ref(storage, filePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      name: file.name,
      url: downloadURL,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file. Please try again.");
  }
}

export async function uploadMultipleFiles(dealId, milestoneIndex, files) {
  if (files.length > 5) {
    throw new Error("Maximum 5 files allowed per milestone");
  }

  const uploadPromises = Array.from(files).map((file) =>
    uploadMilestoneFile(dealId, milestoneIndex, file)
  );

  return Promise.all(uploadPromises);
}

export async function deleteFile(fileUrl) {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    // Don't throw error for delete failures as it's not critical
  }
}
