import React from "react";
import Link from "next/link";

const ToSPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-6 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      <div className="text-primary/80 text-justify">
        By accessing or using our experimental Stock Market Tracker{" "}
        <strong>ACEquity</strong>, you agree to be bound by these terms of
        Service. If you do not agree to these terms, please do not use the
        Service.
        <br />
        <br />
        <strong>No Financial Advice</strong>
        <br />
        The information provided by the Service is for informational and
        personal tracking purposes only. It is not intended as financial,
        investment, tax, or legal advice. You should consult with a professional
        before making any financial decisions.
        <br />
        <br />
        <strong>Experimental Nature & Data Accuracy</strong>
        <br />
        The Service is experimental and provided "as-is." We do not guarantee
        the accuracy, completeness, or timeliness of any data, including stock
        prices, wishlist items, or other financial information. Stock market
        data may be outdated, incorrect, or unavailable at times. Use the
        information at My own risk.
        <br />
        <br />
        <strong>No Liability</strong>
        <br />
        To the maximum extent permitted by law, <strong>ACEquity</strong> and
        its operators shall not be liable for any direct, indirect, incidental,
        special, or consequential damages resulting from My use of the
        Service. This includes, but is not limited to, losses incurred from
        investment decisions based on information provided by the Service.
        <br />
        <br />
        <strong>User Responsibilities</strong>
        <br />
        - You agree to use the Service lawfully and ethically.
        <br />
        - You acknowledge that the Service is subject to updates, modifications,
        or discontinuation at any time without notice.
        <br />
        - You are responsible for any data or preferences you store in the
        Wishlist Tracker.
        <br />
        <br />
        <strong>Third-Party Links & APIs</strong>
        <br />
        The Service may include links to third-party websites or use external
        APIs to fetch stock data. We do not endorse or take responsibility for
        the accuracy or security of any third-party services.
        <br />
        <br />
        <strong>Changes to terms</strong>
        <br />
        We may modify these terms at any time. Continued use of the Service
        after changes constitute My acceptance of the updated terms. It is
        My responsibility to review these terms periodically.
        <br />
        <br />
        <strong>Contact</strong>
        <br />
        If you have any questions or concerns about these terms, please contact
        us at{" "}
        <Link className="font-bold" href="mailto:mail@webark.in">
          mail@webark.in
        </Link>
        <br />
        <br />
        By using the Service, you acknowledge that you have read and understood
        these terms and agree to be bound by them.
      </div>
    </div>
  );
};

export default ToSPage;
