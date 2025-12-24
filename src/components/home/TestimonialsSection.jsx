"use client";

import { useEffect, useState } from "react";
import { Star, PlusCircle, X, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getAllTestimonials,
  getMyTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "@/services/testimonials.service";

const styles = `
  @keyframes slideIn {
    0% { opacity: 0; transform: translateX(100%); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOut {
    0% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(-100%); }
  }
  .slide-enter { animation: slideIn 0.8s ease forwards; }
  .slide-exit { animation: slideOut 0.8s ease forwards; }
  .half-visible { transform: scale(0.9); opacity: 0.6; filter: blur(1px); }
  .animate-fadeIn { animation: fadeIn 1s ease-in-out forwards; }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
`;

export default function TestimonialsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState([]);
  const [userTestimonial, setUserTestimonial] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    authorName: "",
    authorTitle: "",
    review: "",
    rating: 5,
    photo: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch testimonials
  const fetchTestimonials = async () => {
    try {
      const data = await getAllTestimonials();
      setTestimonials(data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    }
  };

  // Fetch user's testimonial
  const fetchUserTestimonial = async () => {
    try {
      const data = await getMyTestimonial();
      setUserTestimonial(data);

      if (data) {
        setFormData({
          authorName: data.authorName,
          authorTitle: data.authorTitle,
          review: data.review,
          rating: data.rating,
          photo: null,
        });
      } else {
        setFormData({
          authorName: user?.displayName || "",
          authorTitle: "",
          review: "",
          rating: 5,
          photo: null,
        });
      }
    } catch (error) {
      console.error("Error fetching user testimonial:", error);
    }
  };

  useEffect(() => {
    fetchTestimonials();
    if (user) {
      fetchUserTestimonial();
    }
  }, [user]);

  // Auto-slide carousel
  useEffect(() => {
    if (testimonials.length > 1 && !showModal) {
      const timer = setTimeout(() => {
        setIsSliding(true);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % testimonials.length);
          setIsSliding(false);
        }, 800);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, testimonials, showModal]);

  // Open Modal
  const handleOpenModal = () => {
    setShowModal(true);
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    setIsSubmitting(true);
    try {
      await deleteTestimonial(userTestimonial.id);

      toast({
        title: "Success",
        description: "Testimonial deleted successfully.",
      });

      setUserTestimonial(null);
      await fetchTestimonials();
      setShowModal(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete testimonial",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (userTestimonial) {
        // Update existing testimonial
        await updateTestimonial(userTestimonial.id, formData);
        toast({
          title: "Success",
          description: "Testimonial updated successfully!",
        });
      } else {
        // Create new testimonial
        await createTestimonial(formData);
        toast({
          title: "Success",
          description: "Testimonial submitted successfully!",
        });
      }

      await fetchTestimonials();
      await fetchUserTestimonial();
      setShowModal(false);
    } catch (err) {
      console.error("Submission error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to submit testimonial",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
        fill={i < rating ? "currentColor" : "none"}
      />
    ));

  const current = testimonials[currentIndex];
  const next =
    testimonials.length > 0
      ? testimonials[(currentIndex + 1) % testimonials.length]
      : null;

  return (
    <div
      className="bg-background py-20 px-4 md:px-20 text-center relative"
      style={{
        backgroundImage:
          "url('https://firebasestorage.googleapis.com/v0/b/penned-aae02.appspot.com/o/General%2FtestimonialbgImage.jpg?alt=media&token=bc374504-4a64-4511-b9b2-3f432d76bbcb')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <style>{styles}</style>

      <h2 className="text-primary-blue font-semibold font-headline text-3xl md:text-4xl mb-6 animate-fadeIn">
        HEAR FROM OUR USERS
      </h2>
      <p className="text-muted-foreground max-w-3xl mx-auto mb-12 font-headline animate-fadeIn">
        Hear from those who already use Mountescrow to power safe and secure
        payments.
      </p>

      {/* CTA */}
      {user ? (
        <button
          onClick={handleOpenModal}
          className="flex items-center font-headline gap-2 mx-auto mb-10 bg-orange-500 hover:bg-highlight-blue text-white px-5 py-3 rounded-full transition-all"
        >
          <PlusCircle size={18} />
          {userTestimonial ? "Update Your Testimonial" : "Add Your Testimonial"}
        </button>
      ) : (
        <a
          href="/login"
          className="text-sm text-muted-foreground bg-orange-500 px-4 py-2 rounded-full hover:bg-highlight-blue text-white transition-all block w-fit mx-auto mb-10"
        >
          Log in to leave a review
        </a>
      )}

      {/* Testimonial Display */}
      {testimonials.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/70 rounded-2xl shadow-lg mx-auto w-[80%] md:w-[50%]">
          <p className="text-gray-600 text-lg font-medium mb-2">
            No reviews yet.
          </p>
        </div>
      ) : (
        <div className="relative flex justify-center items-center overflow-hidden h-[450px]">
          {/* Active Card */}
          <div
            className={`absolute transition-all duration-700 ease-in-out ${
              isSliding ? "slide-exit" : "z-20"
            } w-[90%] md:w-[50%] bg-white p-8 rounded-2xl shadow-xl mx-auto`}
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-6 border-4 border-primary-blue flex items-center justify-center bg-gray-50">
                <img
                  src={current.photoUrl || ""}
                  alt={current.authorName}
                  className="object-cover w-full h-full bg-slate-200"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className="hidden w-full h-full bg-gray-200 items-center justify-center text-gray-500 text-2xl font-bold">
                  {current.authorName?.charAt(0) || "U"}
                </div>
              </div>
              <p className="text-card-foreground italic mb-4 text-lg font-headline">
                "{current.review}"
              </p>
              <div className="flex flex-col items-center">
                <div className="flex justify-center mb-2">
                  {renderStars(current.rating)}
                </div>
                <p className="text-primary font-semibold text-lg">
                  {current.authorName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {current.authorTitle}
                </p>
              </div>
            </div>
          </div>

          {/* Next Card Preview */}
          {next && (
            <div
              className={`absolute right-0 transition-transform duration-700 ${
                isSliding ? "slide-enter" : "half-visible"
              } w-[60%] md:w-[40%] bg-white p-6 rounded-2xl shadow-lg translate-x-[35%] opacity-50`}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-primary-blue flex items-center justify-center bg-gray-50">
                  <img
                    src={next.photoUrl || ""}
                    alt={next.authorName}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="hidden w-full h-full bg-gray-200 items-center justify-center text-gray-500">
                    {next.authorName?.charAt(0) || "U"}
                  </div>
                </div>
                <p className="text-xs italic text-gray-600 line-clamp-2">
                  "{next.review}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold mb-4 text-primary">
              {userTestimonial ? "Update Testimonial" : "Add Testimonial"}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                name="authorName"
                value={formData.authorName}
                onChange={handleInputChange}
                placeholder="Your Name"
                required
                className="border rounded-lg p-2"
              />
              <input
                name="authorTitle"
                value={formData.authorTitle}
                onChange={handleInputChange}
                placeholder="Your Title (e.g. Buyer, Freelancer)"
                required
                className="border rounded-lg p-2"
              />
              <textarea
                name="review"
                value={formData.review}
                onChange={handleInputChange}
                placeholder="Your Review"
                required
                className="border rounded-lg p-2 h-24 resize-none"
              />
              <div className="flex items-center gap-2">
                <label className="text-sm">Rating:</label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="border rounded-lg p-2"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num} Star{num !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border rounded-lg p-2">
                <label className="text-xs text-gray-500 mb-1 block">
                  {userTestimonial ? "Update Photo (Optional)" : "Upload Photo"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-blue text-white rounded-lg py-2 hover:bg-primary/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
                {userTestimonial ? "Update" : "Submit"}
              </button>

              {userTestimonial && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="bg-red-500 text-white rounded-lg py-2 hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Testimonial
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
