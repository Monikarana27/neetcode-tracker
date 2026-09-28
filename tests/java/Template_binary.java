import java.util.*;

public class Template_binary {
static int lowerBound(int[] a,int target) {
    int lo=0,hi=a.length; // Candidate interval [lo,hi).
    while(lo<hi) {
        int mid=lo+(hi-lo)/2;
        if(a[mid]<target) lo=mid+1; else hi=mid;
    }
    return lo; // May equal a.length; a must be sorted.
}
}
