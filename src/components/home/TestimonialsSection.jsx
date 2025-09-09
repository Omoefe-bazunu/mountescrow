"use client";

import { useEffect, useState, useRef } from "react";
import { Star, PlusCircle, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  collection,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Fallback testimonials with placeholder images
const FALLBACK_TESTIMONIALS = [
  {
    id: "fallback1",
    userId: "guest",
    review:
      "Mountescrow gave me peace of mind during a high-value project. I didn’t have to worry about payment.",
    authorName: "Adaeze M.",
    authorTitle: "Freelancer",
    photoUrl: "/placeholder-image-1.jpg", // Replace with real image path
    rating: 5,
  },
  {
    id: "fallback2",
    userId: "guest",
    review:
      "The delivery didn’t go as planned but the dispute system worked perfectly. I got my refund fast.",
    authorName: "Blessing O.",
    authorTitle: "Online Buyer",
    photoUrl: "/placeholder-image-2.jpg", // Replace with real image path
    rating: 4,
  },
  {
    id: "fallback3",
    userId: "guest",
    review:
      "Mountescrow helped my small business gain customer trust and complete sales quicker.",
    authorName: "Chuka N.",
    authorTitle: "Vendor",
    photoUrl: "/placeholder-image-3.jpg", // Replace with real image path
    rating: 5,
  },
];

// CSS for animations
const styles = `
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  @keyframes pulseRotate {
    0%, 100% {
      transform: scale(1) rotate(0deg);
    }
    50% {
      transform: scale(1.05) rotate(2deg);
    }
  }
  
  @keyframes buttonHover {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 rgba(0, 0, 0, 0);
    }
    100% {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
  }
  
  @keyframes skeletonPulse {
    0%, 100% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.3;
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 1s ease-in-out forwards;
  }
  
  .animate-pulseRotate {
    animation: pulseRotate 2s ease-in-out infinite;
  }
  
  .animate-buttonHover {
    animation: buttonHover 0.3s ease-in-out forwards;
  }
  
  .animate-skeletonPulse {
    animation: skeletonPulse 1.5s ease-in-out infinite;
  }
`;

export default function TestimonialsSection() {
  const { user, loading: authLoading } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  // Fetch testimonials from Firestore in real-time
  useEffect(() => {
    if (!authLoading && db) {
      const testimonialsCollection = collection(db, "testimonials");
      const unsubscribe = onSnapshot(
        testimonialsCollection,
        (snapshot) => {
          const fetchedTestimonials = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          if (fetchedTestimonials.length > 0) {
            setTestimonials(fetchedTestimonials);
          } else {
            setTestimonials(FALLBACK_TESTIMONIALS);
          }
          setCurrentTestimonialIndex(0);
        },
        (e) => {
          console.error("Failed to fetch testimonials:", e);
          setError("Failed to load testimonials. Displaying fallback data.");
          setTestimonials(FALLBACK_TESTIMONIALS);
        }
      );

      return () => unsubscribe();
    }
  }, [authLoading, db]);

  // Handle the auto-sliding of testimonials
  useEffect(() => {
    if (testimonials.length > 1) {
      const timer = setTimeout(() => {
        setCurrentTestimonialIndex(
          (prevIndex) => (prevIndex + 1) % testimonials.length
        );
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentTestimonialIndex, testimonials]);

  // Handle modal toggling
  const handleModalToggle = () => {
    setShowModal(!showModal);
    if (!showModal) {
      setEditingTestimonial(null);
    }
  };

  // Handle review submission and editing
  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.target);
    const reviewData = {
      review: formData.get("review"),
      rating: parseInt(formData.get("rating"), 10),
      authorName: formData.get("authorName"),
      authorTitle: formData.get("authorTitle"),
      userId: user?.uid || "", // Ensure userId is set
    };

    // Handle image upload if file is selected
    const file = formData.get("photo");
    let photoUrl = editingTestimonial?.photoUrl || null;
    if (file && file.size > 0) {
      const storageRef = ref(
        storage,
        `testimonials/${user.uid}/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      photoUrl = await getDownloadURL(storageRef);
    }
    reviewData.photoUrl = photoUrl;

    try {
      if (editingTestimonial) {
        const testimonialDocRef = doc(
          db,
          "testimonials",
          editingTestimonial.id
        );
        await updateDoc(testimonialDocRef, reviewData);
      } else {
        await addDoc(collection(db, "testimonials"), reviewData);
      }
      setShowModal(false);
      setEditingTestimonial(null);
    } catch (e) {
      console.error("Error submitting review:", e);
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render star icons based on rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
          fill={i < rating ? "currentColor" : "none"}
        />
      );
    }
    return stars;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl mx-auto bg-card p-8 rounded-2xl shadow-xl w-full">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-gray-200 animate-skeletonPulse mb-6 border-4 border-primary"></div>
            <div className="w-3/4 h-4 bg-gray-200 animate-skeletonPulse mb-4 rounded"></div>
            <div className="w-1/2 h-4 bg-gray-200 animate-skeletonPulse mb-2 rounded"></div>
            <div className="w-1/4 h-4 bg-gray-200 animate-skeletonPulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentTestimonial = testimonials[currentTestimonialIndex];

  return (
    <div
      className="bg-background"
      style={{
        backgroundImage:
          "url('https://firebasestorage.googleapis.com/v0/b/mountescrow-1ac4f.firebasestorage.app/o/staticImages%2FtestimonialbgImage.jpg?alt=media&token=8cdbd7ca-ff97-4e4d-8fcf-30bae9dacfda')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      data-ai-hint="abstract pattern"
    >
      <style>{styles}</style>
      <section className="py-20 px-4 md:px-20 text-center">
        <h2 className="text-primary font-semibold font-headline text-3xl md:text-4xl mb-6 animate-fadeIn">
          HEAR FROM OUR USERS
        </h2>
        <p
          className="text-muted-foreground max-w-3xl mx-auto mb-12 font-body animate-fadeIn"
          style={{ animationDelay: "0.2s" }}
        >
          Hear from those who already use Mountescrow to power safe and secure
          payments.
        </p>
        {user && (
          <div className="flex justify-center mb-10">
            <button
              className="bg-primary text-white font-body px-6 py-3 rounded-full flex items-center gap-2 shadow-lg transition-transform duration-200 hover:scale-105"
              onClick={handleModalToggle}
            >
              <PlusCircle size={20} />
              Write a Review
            </button>
          </div>
        )}

        {/* Testimonial Display Area with Pulse and Rotate Animation */}
        {currentTestimonial && (
          <div className="max-w-2xl mx-auto bg-card p-8 rounded-2xl shadow-xl animate-fadeIn animate-pulseRotate">
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full overflow-hidden mb-6 border-4 border-primary flex items-center justify-center bg-white">
                {currentTestimonial.photoUrl ? (
                  <img
                    src={currentTestimonial.photoUrl}
                    alt={`Avatar of ${currentTestimonial.authorName}`}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.target.style.display = "none"; // Hide image on error
                      e.target.nextSibling.style.display = "flex"; // Show initials
                    }}
                  />
                ) : null}
                <span
                  className="text-4xl font-bold text-blue-600"
                  style={{
                    display: currentTestimonial.photoUrl ? "none" : "flex",
                  }}
                >
                  {currentTestimonial.authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-card-foreground italic mb-4 text-lg font-body">
                “{currentTestimonial.review}”
              </p>
              <div className="flex flex-col items-center">
                <div className="flex justify-center mb-2">
                  {renderStars(currentTestimonial.rating)}
                </div>
                <p className="text-primary font-semibold text-lg">
                  {currentTestimonial.authorName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentTestimonial.authorTitle}
                </p>
              </div>

              {/* Edit/Delete buttons with hover animation */}
              {user && user.uid === currentTestimonial.userId && (
                <div className="flex gap-4 mt-4">
                  <button
                    className="p-2 bg-gray-200 rounded-full transition-colors duration-200 hover:animate-buttonHover"
                    onClick={() => {
                      setEditingTestimonial(currentTestimonial);
                      setShowModal(true);
                    }}
                  >
                    <Edit size={20} className="text-gray-600" />
                  </button>
                  <button
                    className="p-2 bg-red-200 rounded-full transition-colors duration-200 hover:animate-buttonHover"
                    onClick={async () => {
                      try {
                        await deleteDoc(
                          doc(db, "testimonials", currentTestimonial.id)
                        );
                      } catch (e) {
                        console.error("Error deleting testimonial:", e);
                        setError(
                          "Failed to delete testimonial. Ensure you are the owner."
                        );
                      }
                    }}
                  >
                    <Trash2 size={20} className="text-red-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Review Submission/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            ref={modalRef}
            className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full animate-fadeIn"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-headline text-primary">
                {editingTestimonial ? "Edit Your Review" : "Write a Review"}
              </h3>
              <button
                onClick={handleModalToggle}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="review"
                >
                  Your Review
                </label>
                <textarea
                  id="review"
                  name="review"
                  rows="4"
                  defaultValue={editingTestimonial?.review || ""}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="rating"
                >
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  id="rating"
                  name="rating"
                  min="1"
                  max="5"
                  value={editingTestimonial?.rating || ""}
                  onChange={(e) => {
                    if (editingTestimonial) {
                      setEditingTestimonial({
                        ...editingTestimonial,
                        rating: parseInt(e.target.value, 10) || "",
                      });
                    }
                  }}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="authorName"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="authorName"
                  name="authorName"
                  defaultValue={editingTestimonial?.authorName || ""}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="authorTitle"
                >
                  Your Title (e.g., Online Buyer)
                </label>
                <input
                  type="text"
                  id="authorTitle"
                  name="authorTitle"
                  defaultValue={editingTestimonial?.authorTitle || ""}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="photo"
                >
                  Upload Photo (optional)
                </label>
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  accept="image/*"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleModalToggle}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-md transition-colors duration-200 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
