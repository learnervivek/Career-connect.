import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../ui/dialog";
import { Loader2, Building2, Globe, Link as LinkIcon, CheckCircle, AlertCircle } from "lucide-react";
import { ADMIN_PREPARATION_API_END_POINT } from "@/utils/constant";

const CATEGORIES = [
    "IT Services & Consulting",
    "Product & Technology",
    "Service-Based",
    "Product-Based",
    "Fintech",
    "Consulting",
    "E-commerce",
    "Semiconductor",
    "Telecommunications",
    "Conglomerate",
    "Other",
];

const TIERS = ["FAANG/MAMAA", "Tier-1", "Tier-2", "Tier-3", "MNC", "Startup", "Other"];

const AdminCompanyModal = ({ isOpen, onClose, company = null, onSaved }) => {
    const isEdit = !!company?._id;

    const [formData, setFormData] = useState({
        companyName: "",
        slug: "",
        category: "Product & Technology",
        tier: "MNC",
        description: "",
        website: "",
        officialCareersUrl: "",
        careersUrl: "",
        location: "",
        logo: "",
        hiringTracks: "",
        isPreparationHubActive: true,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (company) {
            setFormData({
                companyName: company.companyName || "",
                slug: company.slug || "",
                category: company.category || "Product & Technology",
                tier: company.tier || "MNC",
                description: company.description || "",
                website: company.website || "",
                officialCareersUrl: company.officialCareersUrl || company.careersUrl || "",
                careersUrl: company.careersUrl || "",
                location: company.location || "",
                logo: company.logo || "",
                hiringTracks: Array.isArray(company.hiringTracks)
                    ? company.hiringTracks.join(", ")
                    : "",
                isPreparationHubActive:
                    company.isPreparationHubActive !== undefined
                        ? company.isPreparationHubActive
                        : true,
            });
        } else {
            setFormData({
                companyName: "",
                slug: "",
                category: "Product & Technology",
                tier: "MNC",
                description: "",
                website: "",
                officialCareersUrl: "",
                careersUrl: "",
                location: "",
                logo: "",
                hiringTracks: "",
                isPreparationHubActive: true,
            });
        }
        setError("");
    }, [company, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.companyName.trim()) {
            setError("Company name is required");
            return;
        }

        if (formData.website && !/^https?:\/\//i.test(formData.website.trim())) {
            setError("Website URL must start with http:// or https://");
            return;
        }

        if (formData.officialCareersUrl && !/^https?:\/\//i.test(formData.officialCareersUrl.trim())) {
            setError("Official Careers URL must start with http:// or https://");
            return;
        }

        const payload = {
            ...formData,
            companyName: formData.companyName.trim(),
            slug: formData.slug.trim(),
            careersUrl: formData.officialCareersUrl.trim() || formData.careersUrl.trim(),
            officialCareersUrl: formData.officialCareersUrl.trim(),
            website: formData.website.trim(),
            hiringTracks: formData.hiringTracks
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
        };

        try {
            setLoading(true);
            let res;
            if (isEdit) {
                res = await axios.put(
                    `${ADMIN_PREPARATION_API_END_POINT}/companies/${company._id}`,
                    payload,
                    { withCredentials: true }
                );
            } else {
                res = await axios.post(
                    `${ADMIN_PREPARATION_API_END_POINT}/companies`,
                    payload,
                    { withCredentials: true }
                );
            }

            if (res.data.success) {
                toast.success(res.data.message);
                onSaved(res.data.company);
                onClose();
            } else {
                setError(res.data.message || "Failed to save company");
            }
        } catch (err) {
            console.error("Save company error:", err);
            setError(err.response?.data?.message || "Failed to save company profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <Building2 className="size-5 text-[#6A38C2]" />
                        <span>{isEdit ? `Edit Company: ${company?.companyName}` : "Add New Preparation Company"}</span>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {error && (
                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="companyName" className="text-xs font-semibold">
                                Company Name *
                            </Label>
                            <Input
                                id="companyName"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="e.g. Tata Consultancy Services"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="slug" className="text-xs font-semibold">
                                Unique Slug (Optional, auto-generated)
                            </Label>
                            <Input
                                id="slug"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="e.g. tcs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="category" className="text-xs font-semibold">
                                Category *
                            </Label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full text-xs h-9 px-3 py-1 bg-white border border-gray-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#6A38C2]"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tier" className="text-xs font-semibold">
                                Enterprise Tier
                            </Label>
                            <select
                                id="tier"
                                name="tier"
                                value={formData.tier}
                                onChange={handleChange}
                                className="w-full text-xs h-9 px-3 py-1 bg-white border border-gray-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#6A38C2]"
                            >
                                {TIERS.map((tier) => (
                                    <option key={tier} value={tier}>
                                        {tier}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs font-semibold">
                            Company Overview & Description *
                        </Label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Briefly describe the enterprise, core domain, and general campus/off-campus hiring patterns..."
                            className="w-full text-xs p-3 border border-gray-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#6A38C2]"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="officialCareersUrl" className="text-xs font-semibold">
                                Official Careers URL
                            </Label>
                            <Input
                                id="officialCareersUrl"
                                name="officialCareersUrl"
                                value={formData.officialCareersUrl}
                                onChange={handleChange}
                                placeholder="https://careers.company.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="website" className="text-xs font-semibold">
                                Corporate Website
                            </Label>
                            <Input
                                id="website"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://www.company.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="location" className="text-xs font-semibold">
                                Primary Headquarters / Locations
                            </Label>
                            <Input
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Mumbai, India / Bengaluru"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="logo" className="text-xs font-semibold">
                                Logo Image URL
                            </Label>
                            <Input
                                id="logo"
                                name="logo"
                                value={formData.logo}
                                onChange={handleChange}
                                placeholder="https://logo.clearbit.com/company.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="hiringTracks" className="text-xs font-semibold">
                            Documented Hiring Tracks (Comma-separated)
                        </Label>
                        <Input
                            id="hiringTracks"
                            name="hiringTracks"
                            value={formData.hiringTracks}
                            onChange={handleChange}
                            placeholder="e.g. Ninja (Foundation), Digital (Advanced Coding), Prime (Systems)"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isPreparationHubActive"
                            name="isPreparationHubActive"
                            checked={formData.isPreparationHubActive}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-[#6A38C2] focus:ring-[#6A38C2]"
                        />
                        <Label htmlFor="isPreparationHubActive" className="text-xs font-medium cursor-pointer">
                            Active in Preparation Hub (visible in public catalog)
                        </Label>
                    </div>

                    <DialogFooter className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="text-xs h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#6A38C2] hover:bg-[#5b30a6] text-white text-xs h-9 gap-1.5"
                        >
                            {loading && <Loader2 className="size-3.5 animate-spin" />}
                            <span>{isEdit ? "Save Changes" : "Create Company"}</span>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AdminCompanyModal;
