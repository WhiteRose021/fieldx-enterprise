// src/app/api/metadata/entities/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.ENCORE_API_URL}/metadata/entity-types`, {
      headers: {
        'Authorization': `Bearer ${process.env.ENCORE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch entity types: ${response.statusText}`);
    }

    const { types } = await response.json();

    return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching entity types dynamically:', error);

    // Full fallback with duplicates (we will deduplicate this below)
    const defaultEntities = [
      'Account', 'Contact', 'Lead', 'Opportunity', 'Case',
      'Meeting', 'Call', 'Task', 'Email', 'Campaign',
      'User', 'Team', 'Role', 'Document', 'Email', 'Project',
      'Aytopsies1',      
      'CBilling', 'CChatConversation', 'CChatGroup', 'CChatMessage', 'CChomatourgika',
      'CEarthWork', 'CEmfyshsh', 'CImportLog', 'CKataskeyastikadates', 'CKtiria',
      'CLastDropDates', 'CMaster', 'Contact', 'COutsideAytopsies', 'CPilotAutopsies',
      'CRantevouEmf', 'CSmsSender', 'CSplicingdate', 'CSplicingWork', 'CTobbs',
      'CVlaves', 'CVlavesAppointments', 'Document', 'DocumentFolder', 'Dummy',
      'Email', 'KataskeyesBFasi', 'KataskeyesFTTH', 'KnowledgeBaseArticle', 'KnowledgeBaseCategory',
      'Lead', 'Meeting', 'Note', 'Opportunity', 'RealEstateProperty',
      'RealEstateRequest', 'TargetList', 'Task', 'Test', 'Texnikoselegxos',
      'User', 'Team', 'Role', 'Portal', 'Group', 'EmailAccount'
    ];

    // ✅ Deduplicate list using Set
    const uniqueEntities = [...new Set(defaultEntities)];

    return NextResponse.json(uniqueEntities);
  }
}
