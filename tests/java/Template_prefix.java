import java.util.*;

public class Template_prefix {
static long[] prefixes(int[] a) {
    long[] p = new long[a.length+1];
    for(int i=0;i<a.length;i++) p[i+1]=p[i]+a[i];
    return p; // Sum of [l,r) is p[r]-p[l].
}
}
