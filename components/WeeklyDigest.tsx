import React from 'react';
import { CalendarCheckIcon } from '../constants';

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
            <div className="flex items-start gap-4">
                 <div className="bg-surface/50 rounded-full p-2">
                    <CalendarCheckIcon className="w-6 h-6 text-on-surface-variant" />
                </div>
                <div className="flex-1">
                    <h3 className="text-title-m font-medium text-on-surface">Your Weekly Digest</h3>
                    <p 
                        className="text-body-m mt-2 whitespace-pre-wrap text-on-surface-variant/90"
                        dangerouslySetInnerHTML={{ __html: digest.summary.replace(/\*\*(.*?)\*\*/g, '<strong class="font-medium text-on-surface-variant">$1</strong>') }}
                    ></p>
                </div>
            </div>
        </div>
    );
}