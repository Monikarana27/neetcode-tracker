import java.util.*;

public class Template_answer {
static int speed(int[] piles,int hours) {
    int lo=1,hi=0;
    if(piles.length==0) return 0;
    if(hours<piles.length) return -1; // Positive piles assumed.
    for(int x:piles) hi=Math.max(hi,x);
    while(lo<hi) {
        int mid=lo+(hi-lo)/2; long needed=0;
        for(int x:piles) needed+=(x+(long)mid-1)/mid;
        if(needed<=hours) hi=mid; else lo=mid+1;
    }
    return lo;
}
}
