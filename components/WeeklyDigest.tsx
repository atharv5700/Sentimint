import React from 'react';

interface WeeklyDigestProps {
    digest: {
        summary: string | null;
        weekKey: string;
    };
}

export default function WeeklyDigest({ digest }: WeeklyDigestProps) {
    if (!digest.summary) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-tertiary-container/50 to-primary-container/50 text-on-surface-variant p-4 rounded-3xl shadow-md border border-outline-variant/20">
            <div>
                <h3 className="text-title-m font-medium text-on-surface">Your Weekly Digest</h3>
                <p 
                    className="text-body-m mt-2 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: digest.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                ></p>
            </div>
        </div>
    );
}